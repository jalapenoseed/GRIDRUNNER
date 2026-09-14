#include "GRDronePawn.h"

#include "Camera/CameraComponent.h"
#include "Components/BoxComponent.h"
#include "Components/SceneComponent.h"
#include "Components/StaticMeshComponent.h"
#include "Engine/CollisionProfile.h"
#include "Engine/World.h"
#include "GameFramework/SpringArmComponent.h"

namespace
{
    constexpr float Gravity = 980.0f;
    constexpr float MaxTiltDegrees = 32.0f;
    constexpr float MaxHorizontalSpeed = 1400.0f;
    constexpr float MaxVerticalSpeed = 500.0f;
    constexpr float MaxFlightRadius = 50000.0f;
    constexpr float MaxFlightHeight = 2400.0f;
}

AGRDronePawn::AGRDronePawn()
{
    PrimaryActorTick.bCanEverTick = true;
    bUseControllerRotationPitch = false;
    bUseControllerRotationYaw = false;
    bUseControllerRotationRoll = false;

    CollisionRoot = CreateDefaultSubobject<UBoxComponent>(TEXT("SCOUTCollision"));
    SetRootComponent(CollisionRoot);
    CollisionRoot->SetMobility(EComponentMobility::Movable);
    CollisionRoot->InitBoxExtent(FVector(28.0f, 24.0f, 11.0f));
    CollisionRoot->SetCollisionProfileName(UCollisionProfile::Pawn_ProfileName);
    CollisionRoot->SetCollisionEnabled(ECollisionEnabled::QueryAndPhysics);
    CollisionRoot->SetSimulatePhysics(false);
    CollisionRoot->SetCanEverAffectNavigation(false);

    VisualRoot = CreateDefaultSubobject<USceneComponent>(TEXT("ApprovedAssembly"));
    VisualRoot->SetupAttachment(CollisionRoot);

    CameraArm = CreateDefaultSubobject<USpringArmComponent>(TEXT("SCOUTCameraArm"));
    CameraArm->SetupAttachment(CollisionRoot);
    CameraArm->TargetArmLength = 145.0f;
    CameraArm->SocketOffset = FVector(0.0f, 0.0f, 26.0f);
    CameraArm->bUsePawnControlRotation = false;
    CameraArm->SetUsingAbsoluteRotation(true);
    CameraArm->bEnableCameraLag = true;
    CameraArm->CameraLagSpeed = 9.0f;
    CameraArm->bDoCollisionTest = true;
    CameraArm->ProbeSize = 8.0f;

    Camera = CreateDefaultSubobject<UCameraComponent>(TEXT("SCOUTCamera"));
    Camera->SetupAttachment(CameraArm, USpringArmComponent::SocketName);
    Camera->FieldOfView = 92.0f;
    Camera->bUsePawnControlRotation = false;
}

void AGRDronePawn::BeginPlay()
{
    Super::BeginPlay();
    if (!bHomeSet && HomeLocation.IsNearlyZero())
    {
        HomeLocation = GetActorLocation();
        FHitResult Ground;
        FCollisionQueryParams Query(SCENE_QUERY_STAT(SCOUTHome), false, this);
        const FVector Start = GetActorLocation();
        if (GetWorld()->LineTraceSingleByChannel(Ground, Start,
            Start - FVector(0.0f, 0.0f, 2000.0f), ECC_WorldStatic, Query))
        {
            HomeLocation = Ground.ImpactPoint + FVector(0.0f, 0.0f,
                CollisionRoot->GetScaledBoxExtent().Z + 3.0f);
        }
    }
    CameraArm->SetWorldRotation(FRotator(-12.0f, GetActorRotation().Yaw, 0.0f));
}

void AGRDronePawn::SetHomeLocation(const FVector& Location)
{
    if (!Location.ContainsNaN())
    {
        HomeLocation = Location;
        bHomeSet = true;
    }
}

void AGRDronePawn::SetFlightInput(float Forward, float Right, float Up, float Yaw, float Pitch)
{
    const auto Axis = [](float Value)
    {
        return FMath::IsFinite(Value) ? FMath::Clamp(Value, -1.0f, 1.0f) : 0.0f;
    };
    TranslationInput = FVector(Axis(Forward), Axis(Right), Axis(Up));
    YawInput = Axis(Yaw);
    PitchInput = Axis(Pitch);
}

void AGRDronePawn::InitializeAssembly(const TArray<AActor*>& SourceActors)
{
    TArray<UStaticMeshComponent*> Sources;
    TSet<UStaticMeshComponent*> Seen;
    FBox AssemblyBounds(ForceInit);
    for (AActor* Source : SourceActors)
    {
        if (!IsValid(Source) || Source == this)
        {
            continue;
        }
        TArray<UStaticMeshComponent*> Meshes;
        Source->GetComponents<UStaticMeshComponent>(Meshes);
        for (UStaticMeshComponent* Mesh : Meshes)
        {
            if (IsValid(Mesh) && Mesh->GetStaticMesh() && !Seen.Contains(Mesh))
            {
                Seen.Add(Mesh);
                Sources.Add(Mesh);
                AssemblyBounds += Mesh->Bounds.GetBox();
            }
        }
    }
    if (Sources.IsEmpty() || !AssemblyBounds.IsValid)
    {
        return;
    }

    for (UStaticMeshComponent* Existing : AssemblyComponents)
    {
        if (IsValid(Existing))
        {
            Existing->DestroyComponent();
        }
    }
    AssemblyComponents.Reset();
    const FTransform AssemblyFrame(FQuat::Identity, AssemblyBounds.GetCenter());
    for (UStaticMeshComponent* Source : Sources)
    {
        UStaticMeshComponent* Copy = NewObject<UStaticMeshComponent>(this);
        Copy->SetMobility(EComponentMobility::Movable);
        Copy->SetupAttachment(VisualRoot);
        Copy->SetStaticMesh(Source->GetStaticMesh());
        Copy->SetCollisionEnabled(ECollisionEnabled::NoCollision);
        Copy->SetGenerateOverlapEvents(false);
        Copy->SetCanEverAffectNavigation(false);
        Copy->SetRelativeTransform(Source->GetComponentTransform().GetRelativeTransform(AssemblyFrame));
        for (int32 Slot = 0; Slot < Source->GetNumMaterials(); ++Slot)
        {
            Copy->SetMaterial(Slot, Source->GetMaterial(Slot));
        }
        AddInstanceComponent(Copy);
        Copy->RegisterComponent();
        AssemblyComponents.Add(Copy);
    }

    // Bounds change only the collision proxy, never the imported mesh transforms.
    const FVector Extent = AssemblyBounds.GetExtent();
    CollisionRoot->SetBoxExtent(FVector(
        FMath::Clamp(Extent.X, 16.0, 80.0),
        FMath::Clamp(Extent.Y, 16.0, 80.0),
        FMath::Clamp(Extent.Z, 8.0, 35.0)));
}

void AGRDronePawn::RequestReturn()
{
    if (!bLanded)
    {
        if (!bReturning)
        {
            ReturnSimSeconds = 0.0f;
            ReturnRawSeconds = 0.0f;
            NextReturnLogSeconds = 0.0f;
            ReturnTarget = HomeLocation;
            LastBlockingActor = TEXT("none");
            LastHitNormal = FVector::ZeroVector;
            bLastStartPenetrating = false;
            UE_LOG(LogTemp, Display, TEXT("GR_SCOUT_RETURN_REQUEST pos=%s home=%s velocity=%s parts=%d"),
                *GetActorLocation().ToCompactString(), *HomeLocation.ToCompactString(),
                *FlightVelocity.ToCompactString(), AssemblyComponents.Num());
        }
        bReturning = true;
        TranslationInput = FVector::ZeroVector;
        YawInput = 0.0f;
        PitchInput = 0.0f;
    }
}

FVector AGRDronePawn::GetVelocity() const
{
    return FlightVelocity;
}

void AGRDronePawn::Tick(float DeltaSeconds)
{
    Super::Tick(DeltaSeconds);
    if (bLanded || DeltaSeconds <= 0.0f)
    {
        return;
    }
    if (!FMath::IsFinite(Battery))
    {
        Battery = 0.0f;
    }
    Battery = FMath::Clamp(Battery, 0.0f, 100.0f);
    if (Battery <= 12.0f)
    {
        RequestReturn();
    }

    if (bReturning)
    {
        ReturnRawSeconds += DeltaSeconds;
    }

    float Remaining = FMath::Min(DeltaSeconds, 0.25f);
    while (Remaining > KINDA_SMALL_NUMBER && !bLanded)
    {
        const float Step = FMath::Min(Remaining, 1.0f / 60.0f);
        SimulateFlight(Step);
        MoveWithCollision(Step);
        Remaining -= Step;
    }
    const FRotator DesiredCamera(-12.0f + GetActorRotation().Pitch * 0.2f,
        GetActorRotation().Yaw, 0.0f);
    CameraArm->SetWorldRotation(FMath::RInterpTo(CameraArm->GetComponentRotation(),
        DesiredCamera, DeltaSeconds, 7.0f));

    if (bReturning && (ReturnSimSeconds >= NextReturnLogSeconds || bLanded || DeltaSeconds > 0.5f))
    {
        FHitResult Ground;
        FCollisionQueryParams Query(SCENE_QUERY_STAT(SCOUTReturnGround), false, this);
        const FVector Here = GetActorLocation();
        const bool bGrounded = GetWorld()->LineTraceSingleByChannel(Ground, Here,
            Here - FVector(0.0f, 0.0f, CollisionRoot->GetScaledBoxExtent().Z + 5.0f),
            ECC_Visibility, Query);
        UE_LOG(LogTemp, Display,
            TEXT("GR_SCOUT_RETURN sim=%.2f raw=%.2f dt=%.3f pos=%s target=%s home=%s dist=%.1f speed=%.1f hit=%s normal=%s penetrating=%d grounded=%d landed=%d"),
            ReturnSimSeconds, ReturnRawSeconds, DeltaSeconds,
            *Here.ToCompactString(), *ReturnTarget.ToCompactString(), *HomeLocation.ToCompactString(),
            FVector::Dist(Here, HomeLocation), FlightVelocity.Size(),
            *LastBlockingActor, *LastHitNormal.ToCompactString(),
            bLastStartPenetrating, bGrounded, bLanded);
        NextReturnLogSeconds = ReturnSimSeconds + 1.0f;
    }
}

void AGRDronePawn::SimulateFlight(float StepSeconds)
{
    if (bReturning)
    {
        ReturnSimSeconds += StepSeconds;
    }
    FRotator Attitude = GetActorRotation();
    float TargetPitch = FMath::Clamp(-TranslationInput.X + PitchInput, -1.0, 1.0) * MaxTiltDegrees;
    float TargetRoll = TranslationInput.Y * MaxTiltDegrees;
    FVector Acceleration = FVector::ZeroVector;

    if (bReturning && Battery > 0.0f)
    {
        const FVector Here = GetActorLocation();
        const float HorizontalDistance = FVector::Dist2D(Here, HomeLocation);
        FVector Target = HomeLocation;
        if (HorizontalDistance > 150.0f)
        {
            Target.Z = FMath::Max(HomeLocation.Z + 180.0, Here.Z);
        }
        if (ReturnClimbSeconds > 0.0f)
        {
            Target.Z = FMath::Min(Here.Z + 200.0, HomeLocation.Z + MaxFlightHeight);
            ReturnClimbSeconds -= StepSeconds;
        }
        ReturnTarget = Target;
        const FVector DesiredVelocity = ((Target - Here) * 1.5f).GetClampedToMaxSize(700.0f);
        Acceleration = ((DesiredVelocity - FlightVelocity) * 2.4f).GetClampedToMaxSize(1100.0f);
        const FVector LocalAcceleration = FRotator(0.0f, Attitude.Yaw, 0.0f)
            .UnrotateVector(Acceleration);
        TargetPitch = FMath::Clamp(-LocalAcceleration.X / Gravity, -0.5, 0.5) * 55.0f;
        TargetRoll = FMath::Clamp(LocalAcceleration.Y / Gravity, -0.5, 0.5) * 55.0f;
        if (HorizontalDistance > 100.0f)
        {
            const float DesiredYaw = (HomeLocation - Here).Rotation().Yaw;
            Attitude.Yaw = FMath::FixedTurn(Attitude.Yaw, DesiredYaw, 80.0f * StepSeconds);
        }
        if (FVector::Dist(Here, HomeLocation) < 4.0f && FlightVelocity.Size() < 15.0f)
        {
            FHitResult DockHit;
            AddActorWorldOffset(HomeLocation - Here, true, &DockHit, ETeleportType::None);
            bLanded = true;
            FlightVelocity = FVector::ZeroVector;
            Attitude.Pitch = 0.0f;
            Attitude.Roll = 0.0f;
            SetActorRotation(Attitude);
            return;
        }
    }
    else
    {
        Attitude.Yaw = FRotator::NormalizeAxis(Attitude.Yaw + YawInput * 100.0f * StepSeconds);
    }

    Attitude.Pitch = FMath::FInterpTo(Attitude.Pitch, TargetPitch, StepSeconds, 4.0f);
    Attitude.Roll = FMath::FInterpTo(Attitude.Roll, TargetRoll, StepSeconds, 4.0f);
    SetActorRotation(Attitude);

    if (!bReturning || Battery <= 0.0f)
    {
        if (Battery > 0.0f)
        {
            const FVector ThrustDirection = GetActorUpVector();
            // Tilt produces lateral acceleration; hover assist supplies the
            // additional rotor load needed to hold altitude while banking.
            Acceleration = ThrustDirection * (Gravity / FMath::Max(ThrustDirection.Z, 0.45))
                - FVector(0.0f, 0.0f, Gravity);
            Acceleration.Z += TranslationInput.Z * 820.0f;
            Acceleration -= FVector(FlightVelocity.X * 0.85f,
                FlightVelocity.Y * 0.85f, FlightVelocity.Z * 2.0f);
        }
        else
        {
            // Reserve return begins before depletion. At zero battery, settle
            // locally under gravity; never continue to fly with unlimited power.
            Acceleration = FVector(-FlightVelocity.X * 1.6f,
                -FlightVelocity.Y * 1.6f, -Gravity);
        }
    }

    FlightVelocity += Acceleration * StepSeconds;
    FVector Horizontal(FlightVelocity.X, FlightVelocity.Y, 0.0f);
    Horizontal = Horizontal.GetClampedToMaxSize(MaxHorizontalSpeed);
    FlightVelocity.X = Horizontal.X;
    FlightVelocity.Y = Horizontal.Y;
    FlightVelocity.Z = FMath::Clamp(FlightVelocity.Z,
        -static_cast<double>(MaxVerticalSpeed), static_cast<double>(MaxVerticalSpeed));
    const float Load = FMath::Abs(TranslationInput.Z) * 0.08f
        + Horizontal.Size() / MaxHorizontalSpeed * 0.08f;
    Battery = FMath::Max(0.0f, Battery - (0.065f + Load) * StepSeconds);
}

void AGRDronePawn::MoveWithCollision(float StepSeconds)
{
    if (bLanded)
    {
        return;
    }
    const FVector Here = GetActorLocation();
    FVector Target = Here + FlightVelocity * StepSeconds;
    Target.X = FMath::Clamp(Target.X, HomeLocation.X - MaxFlightRadius, HomeLocation.X + MaxFlightRadius);
    Target.Y = FMath::Clamp(Target.Y, HomeLocation.Y - MaxFlightRadius, HomeLocation.Y + MaxFlightRadius);
    Target.Z = FMath::Clamp(Target.Z, HomeLocation.Z - 500.0, HomeLocation.Z + MaxFlightHeight);
    FHitResult Hit;
    AddActorWorldOffset(Target - Here, true, &Hit, ETeleportType::None);
    if (Hit.bBlockingHit)
    {
        if (bReturning)
        {
            LastBlockingActor = GetNameSafe(Hit.GetActor()) + TEXT("/") + GetNameSafe(Hit.GetComponent());
            LastHitNormal = Hit.ImpactNormal;
            bLastStartPenetrating = Hit.bStartPenetrating;
        }
        const bool bGroundContact = Hit.ImpactNormal.Z > 0.55f && FlightVelocity.Z <= 0.0f;
        if (bGroundContact && (Battery <= 0.0f ||
            (bReturning && FVector::Dist2D(GetActorLocation(), HomeLocation) < 110.0f)))
        {
            FlightVelocity = FVector::ZeroVector;
            SetActorRotation(FRotator(0.0f, GetActorRotation().Yaw, 0.0f));
            bLanded = true;
            return;
        }
        FlightVelocity = FVector::VectorPlaneProject(FlightVelocity, Hit.Normal) * 0.55f;
        if (bReturning && Hit.ImpactNormal.Z < 0.45f)
        {
            ReturnClimbSeconds = 1.0f;
        }
        FHitResult SlideHit;
        AddActorWorldOffset(FlightVelocity * StepSeconds * (1.0f - Hit.Time),
            true, &SlideHit, ETeleportType::None);
    }
    if (FMath::Abs(Target.X - HomeLocation.X) >= MaxFlightRadius - 1.0f)
    {
        FlightVelocity.X = 0.0f;
    }
    if (FMath::Abs(Target.Y - HomeLocation.Y) >= MaxFlightRadius - 1.0f)
    {
        FlightVelocity.Y = 0.0f;
    }
    if (Target.Z >= HomeLocation.Z + MaxFlightHeight - 1.0f && FlightVelocity.Z > 0.0f)
    {
        FlightVelocity.Z = 0.0f;
    }
}
