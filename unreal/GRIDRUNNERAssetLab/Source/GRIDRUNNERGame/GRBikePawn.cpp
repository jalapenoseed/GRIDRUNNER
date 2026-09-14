#include "GRBikePawn.h"

#include "Animation/AnimInstance.h"
#include "Animation/AnimationAsset.h"
#include "Camera/CameraComponent.h"
#include "ChaosVehicleWheel.h"
#include "ChaosWheeledVehicleMovementComponent.h"
#include "Components/SkeletalMeshComponent.h"
#include "Engine/SkeletalMesh.h"
#include "GameFramework/SpringArmComponent.h"
#include "Misc/CommandLine.h"
#include "Misc/Parse.h"
#include "PhysicsEngine/PhysicsAsset.h"

AGRBikePawn::AGRBikePawn(const FObjectInitializer& ObjectInitializer)
    : Super(ObjectInitializer)
{
    PrimaryActorTick.bCanEverTick = true;
    PrimaryActorTick.TickGroup = TG_PrePhysics;
    bUseControllerRotationPitch = false;
    bUseControllerRotationYaw = false;
    bUseControllerRotationRoll = false;
    AutoPossessAI = EAutoPossessAI::Disabled;

    CameraBoom = CreateDefaultSubobject<USpringArmComponent>(TEXT("BikeCameraBoom"));
    CameraBoom->SetupAttachment(GetMesh());
    // The imported skeletal root is near the tire contact plane. Start the boom's
    // collision sweep above the road, otherwise its probe collapses into the ground.
    CameraBoom->SetRelativeLocation(FVector(0.f, 0.f, 115.f));
    CameraBoom->TargetArmLength = 440.f;
    CameraBoom->SocketOffset = FVector(0.f, 32.f, 25.f);
    CameraBoom->SetRelativeRotation(FRotator(-12.f, 0.f, 0.f));
    CameraBoom->bUsePawnControlRotation = true;
    CameraBoom->bInheritRoll = false;
    CameraBoom->bEnableCameraLag = true;
    CameraBoom->CameraLagSpeed = 7.f;
    CameraBoom->ProbeSize = 16.f;

    FollowCamera = CreateDefaultSubobject<UCameraComponent>(TEXT("BikeCamera"));
    FollowCamera->SetupAttachment(CameraBoom, USpringArmComponent::SocketName);
    FollowCamera->FieldOfView = 82.f;

    Rider = CreateDefaultSubobject<USkeletalMeshComponent>(TEXT("BikeRider"));
    Rider->SetupAttachment(GetMesh());
    Rider->SetCollisionEnabled(ECollisionEnabled::NoCollision);
    Rider->SetGenerateOverlapEvents(false);
    Rider->SetHiddenInGame(true);
    Rider->VisibilityBasedAnimTickOption = EVisibilityBasedAnimTickOption::AlwaysTickPoseAndRefreshBones;

    VendorTemplateClass = TSoftClassPtr<AWheeledVehiclePawn>(FSoftObjectPath(TEXT("/Game/Bike/BikeBP/BikeBP.BikeBP_C")));
    RiderMeshAsset = TSoftObjectPtr<USkeletalMesh>(FSoftObjectPath(TEXT("/Game/MotoInteractionAnims/Demo/Characters/Mannequins/Meshes/SKM_Manny_Simple.SKM_Manny_Simple")));
    RiderIdleAnimation = TSoftObjectPtr<UAnimationAsset>(FSoftObjectPath(TEXT("/Game/MotoInteractionAnims/Animations/Mounted/Idle/AS_Idle_Riding.AS_Idle_Riding")));

    GetMesh()->SetCollisionProfileName(TEXT("Vehicle"));
    GetMesh()->SetCollisionResponseToChannel(ECC_Camera, ECR_Ignore);
    GetMesh()->BodyInstance.bUseCCD = true;
}

UChaosWheeledVehicleMovementComponent* AGRBikePawn::BikeMovement() const
{
    return Cast<UChaosWheeledVehicleMovementComponent>(GetVehicleMovementComponent());
}

bool AGRBikePawn::SetupFromTemplate(UClass* VendorClass)
{
    if (!VendorClass || !VendorClass->IsChildOf(AWheeledVehiclePawn::StaticClass()))
    {
        UE_LOG(LogTemp, Error, TEXT("GRIDRUNNER bike: vendor class must derive from WheeledVehiclePawn."));
        return false;
    }

    const AWheeledVehiclePawn* Source = Cast<AWheeledVehiclePawn>(VendorClass->GetDefaultObject());
    USkeletalMeshComponent* SourceMesh = Source ? Source->GetMesh() : nullptr;
    const UChaosWheeledVehicleMovementComponent* SourceMovement = Source
        ? Cast<UChaosWheeledVehicleMovementComponent>(Source->GetVehicleMovementComponent()) : nullptr;
    UChaosWheeledVehicleMovementComponent* Movement = BikeMovement();

    if (!SourceMesh || !SourceMesh->GetSkeletalMeshAsset() || !SourceMesh->GetPhysicsAsset()
        || !SourceMovement || SourceMovement->WheelSetups.Num() < 2 || !Movement)
    {
        UE_LOG(LogTemp, Error, TEXT("GRIDRUNNER bike: vendor CDO is missing its skeletal mesh, physics asset or wheel setups."));
        return false;
    }

    for (const FChaosWheelSetup& Setup : SourceMovement->WheelSetups)
    {
        if (!Setup.WheelClass || SourceMesh->GetBoneIndex(Setup.BoneName) == INDEX_NONE)
        {
            UE_LOG(LogTemp, Error, TEXT("GRIDRUNNER bike: invalid wheel class or wheel bone '%s'."), *Setup.BoneName.ToString());
            return false;
        }
    }

    // Keep original rig, materials, wheel dimensions and suspension calibration. Nothing is
    // spawned from the vendor Blueprint, so its engine audio/input graph never runs.
    GetMesh()->SetSimulatePhysics(false);
    GetMesh()->SetSkeletalMeshAsset(SourceMesh->GetSkeletalMeshAsset());
    GetMesh()->SetPhysicsAsset(SourceMesh->GetPhysicsAsset(), true);
    GetMesh()->SetRelativeScale3D(SourceMesh->GetRelativeScale3D());
    for (int32 Index = 0; Index < SourceMesh->GetNumMaterials(); ++Index)
    {
        GetMesh()->SetMaterial(Index, SourceMesh->GetMaterial(Index));
    }
    if (SourceMesh->GetAnimClass())
    {
        GetMesh()->SetAnimInstanceClass(SourceMesh->GetAnimClass());
    }

    Movement->WheelSetups = SourceMovement->WheelSetups;
    Movement->WheelTraceCollisionResponses = SourceMovement->WheelTraceCollisionResponses;
    Movement->EngineSetup = SourceMovement->EngineSetup;
    Movement->TransmissionSetup = SourceMovement->TransmissionSetup;
    Movement->DifferentialSetup = SourceMovement->DifferentialSetup;
    Movement->SteeringSetup = SourceMovement->SteeringSetup;
    Movement->InertiaTensorScale = SourceMovement->InertiaTensorScale;
    Movement->bEnableCenterOfMassOverride = SourceMovement->bEnableCenterOfMassOverride;
    Movement->CenterOfMassOverride = SourceMovement->CenterOfMassOverride;
    Movement->ChassisWidth = SourceMovement->ChassisWidth;
    Movement->ChassisHeight = SourceMovement->ChassisHeight;
    ConfigureElectricDrive();

    GetMesh()->SetCollisionEnabled(ECollisionEnabled::QueryAndPhysics);
    GetMesh()->SetCollisionProfileName(TEXT("Vehicle"));
    GetMesh()->SetCollisionResponseToChannel(ECC_Camera, ECR_Ignore);
    GetMesh()->SetSimulatePhysics(true);
    GetMesh()->SetEnableGravity(true);
    Movement->SetUpdatedComponent(GetMesh());
    Movement->RecreatePhysicsState();
    Movement->SetTargetGear(1, true);
    Movement->SetHandbrakeInput(GetController() == nullptr);
    GetMesh()->WakeAllRigidBodies();
    Movement->SetSleeping(false);
    bDriveReady = Movement->CanCreateVehicle();
    UE_LOG(LogTemp, Display, TEXT("GRIDRUNNER electric bike: rig %s, %d Chaos wheels, ready=%d"),
        *GetMesh()->GetSkeletalMeshAsset()->GetName(), Movement->WheelSetups.Num(), bDriveReady);
    return bDriveReady;
}

void AGRBikePawn::ConfigureElectricDrive()
{
    UChaosWheeledVehicleMovementComponent* Movement = BikeMovement();
    if (!Movement) return;

    Movement->Mass = FMath::Max(50.f, VehicleMassKg);
    Movement->bSuspensionEnabled = true;
    Movement->bWheelFrictionEnabled = true;
    Movement->bMechanicalSimEnabled = true;
    Movement->DragCoefficient = 0.65f;
    Movement->DownforceCoefficient = 0.f;
    Movement->bReverseAsBrake = false;
    Movement->bThrottleAsBrake = false;
    Movement->TorqueControl.Enabled = false;
    Movement->TargetRotationControl.Enabled = false;
    Movement->StabilizeControl.Enabled = false;
    Movement->SetRequiresControllerForInputs(true);

    // Chaos calls this "engine", but the normalized flat-then-power-limited curve and
    // fixed reduction implement an electric motor, with no idle propulsion or shift loop.
    Movement->EngineSetup.TorqueCurve.ExternalCurve = nullptr;
    FRichCurve* TorqueCurve = Movement->EngineSetup.TorqueCurve.GetRichCurve();
    TorqueCurve->Reset();
    TorqueCurve->AddKey(0.f, 1.f);
    TorqueCurve->AddKey(2400.f, 1.f);
    TorqueCurve->AddKey(4000.f, 0.60f);
    TorqueCurve->AddKey(6000.f, 0.40f);
    TorqueCurve->AddKey(6500.f, 0.f);
    Movement->EngineSetup.MaxTorque = FMath::Max(1.f, MaxMotorTorqueNm);
    Movement->EngineSetup.MaxRPM = 6500.f;
    Movement->EngineSetup.EngineIdleRPM = 1.f;
    Movement->EngineSetup.EngineBrakeEffect = 0.015f;
    Movement->EngineSetup.EngineRevUpMOI = 0.35f;
    Movement->EngineSetup.EngineRevDownRate = 2500.f;

    Movement->TransmissionSetup.bUseAutomaticGears = false;
    Movement->TransmissionSetup.bUseAutoReverse = false;
    Movement->TransmissionSetup.ForwardGearRatios = {1.f};
    Movement->TransmissionSetup.ReverseGearRatios = {1.f};
    Movement->TransmissionSetup.FinalRatio = 8.f;
    Movement->TransmissionSetup.GearChangeTime = 0.f;
    Movement->TransmissionSetup.TransmissionEfficiency = 0.94f;
    Movement->SetUseAutomaticGears(false);
    Movement->DifferentialSetup.DifferentialType = EVehicleDifferential::RearWheelDrive;
    Movement->SteeringSetup.SteeringType = ESteeringType::SingleAngle;
    Movement->SteeringSetup.SteeringCurve.ExternalCurve = nullptr;
    FRichCurve* SteeringCurve = Movement->SteeringSetup.SteeringCurve.GetRichCurve();
    SteeringCurve->Reset();
    SteeringCurve->AddKey(0.f, 1.f);
    SteeringCurve->AddKey(12.f, 0.70f);
    SteeringCurve->AddKey(30.f, 0.30f);
    SteeringCurve->AddKey(55.f, 0.17f);
    Movement->ThrottleInputRate.RiseRate = 2.5f;
    Movement->ThrottleInputRate.FallRate = 6.f;
    Movement->SteeringInputRate.RiseRate = 2.2f;
    Movement->SteeringInputRate.FallRate = 3.5f;
}

void AGRBikePawn::BeginPlay()
{
    Super::BeginPlay();
    bDiagnostics = FParse::Param(FCommandLine::Get(), TEXT("GRSmokeTest"));
    if (!bDriveReady)
    {
        SetupFromTemplate(VendorTemplateClass.LoadSynchronous());
    }
    if (USkeletalMesh* RiderMesh = RiderMeshAsset.LoadSynchronous())
    {
        Rider->SetSkeletalMeshAsset(RiderMesh);
    }
    Rider->SetRelativeTransform(RiderTransform);
    if (Rider->GetSkeletalMeshAsset())
    {
        if (UAnimationAsset* Idle = RiderIdleAnimation.LoadSynchronous())
        {
            Rider->PlayAnimation(Idle, true);
        }
    }
    SetRiderVisible(GetController() != nullptr);
}

void AGRBikePawn::PossessedBy(AController* NewController)
{
    Super::PossessedBy(NewController);
    if (UChaosWheeledVehicleMovementComponent* Movement = BikeMovement())
    {
        Movement->SetHandbrakeInput(false);
        Movement->SetSleeping(false);
    }
    GetMesh()->WakeAllRigidBodies();
    SetRiderVisible(true);
}

void AGRBikePawn::UnPossessed()
{
    SetDriveInput(0.f, 0.f, 1.f);
    if (UChaosWheeledVehicleMovementComponent* Movement = BikeMovement())
    {
        Movement->SetThrottleInput(0.f);
        Movement->SetBrakeInput(1.f);
        Movement->SetSteeringInput(0.f);
        Movement->SetHandbrakeInput(true);
    }
    SetRiderVisible(false);
    Super::UnPossessed();
}

void AGRBikePawn::SetDriveInput(float Throttle, float Steering, float Brake)
{
    RequestedThrottle = FMath::Clamp(Throttle, -1.f, 1.f);
    RequestedSteering = FMath::Clamp(Steering, -1.f, 1.f);
    RequestedBrake = FMath::Clamp(Brake, 0.f, 1.f);
}

float AGRBikePawn::SpeedKmh() const
{
    const UChaosWheeledVehicleMovementComponent* Movement = BikeMovement();
    return Movement ? FMath::Abs(Movement->GetForwardSpeed()) * 0.036f : 0.f;
}

void AGRBikePawn::SetRiderVisible(bool bVisible)
{
    Rider->SetHiddenInGame(!bVisible || !Rider->GetSkeletalMeshAsset());
}

void AGRBikePawn::AddBattery(float Percentage)
{
    Battery = FMath::Clamp(Battery + Percentage, 0.f, 100.f);
}

bool AGRBikePawn::HasWheelContact() const
{
    const UChaosWheeledVehicleMovementComponent* Movement = BikeMovement();
    if (!Movement || !Movement->HasValidPhysicsState()) return false;
    for (int32 Index = 0; Index < Movement->GetNumWheels(); ++Index)
    {
        if (Movement->GetWheelState(Index).bInContact) return true;
    }
    return false;
}

void AGRBikePawn::UpdateBalance(float DeltaSeconds)
{
    if (!GetMesh()->IsSimulatingPhysics() || !HasWheelContact()) return;

    const FVector Forward = GetActorForwardVector();
    const FVector CurrentUp = GetActorUpVector();
    // The rider supports a stopped bike. While moving, lean toward the physical turn.
    const float LeanTarget = GetController()
        ? -RequestedSteering * MaxLeanDegrees * FMath::Clamp(SpeedKmh() / 35.f, 0.f, 1.f) : 0.f;
    SmoothedLean = FMath::FInterpTo(SmoothedLean, LeanTarget, DeltaSeconds, 3.f);
    FVector TargetUp = FVector::UpVector.RotateAngleAxis(SmoothedLean, Forward);
    TargetUp = FVector::VectorPlaneProject(TargetUp, Forward).GetSafeNormal();
    if (TargetUp.IsNearlyZero()) return;

    // Roll correction only. Do not constrain pitch/yaw or directly move/rotate the actor.
    const float RollError = FVector::DotProduct(FVector::CrossProduct(CurrentUp, TargetUp), Forward);
    const float RollRate = FVector::DotProduct(GetMesh()->GetPhysicsAngularVelocityInRadians(), Forward);
    // Implicit PD gains stay well behaved when shader compilation or a slow GPU makes
    // the game thread hitch; explicit high-gain damping can flip a two-wheel vehicle.
    const float Step = FMath::Max(0.f, DeltaSeconds);
    const float Gain = 1.f / (1.f + BalanceDamping * Step + BalanceStrength * Step * Step);
    const float Correction = FMath::Clamp((RollError * BalanceStrength
        - RollRate * (BalanceDamping + BalanceStrength * Step)) * Gain, -80.f, 80.f);
    GetMesh()->AddTorqueInRadians(Forward * Correction, NAME_None, true);
}

void AGRBikePawn::UpdateDriveAndEnergy(float DeltaSeconds)
{
    UChaosWheeledVehicleMovementComponent* Movement = BikeMovement();
    if (!Movement || !bDriveReady) return;

    const float SignedSpeedCm = Movement->GetForwardSpeed();
    const float SpeedCm = FMath::Abs(SignedSpeedCm);
    const bool bOccupied = GetController() != nullptr;
    float Throttle = bOccupied && Battery > 0.f ? RequestedThrottle : 0.f;
    float Brake = bOccupied ? RequestedBrake : 1.f;
    const int32 DesiredGear = Throttle < -0.05f ? -1 : 1;
    if (FMath::Abs(Throttle) > 0.05f && SignedSpeedCm * DesiredGear < -35.f)
    {
        Brake = FMath::Max(Brake, FMath::Abs(Throttle));
        Throttle = 0.f;
    }
    else if (FMath::Abs(Throttle) > 0.05f)
    {
        Movement->SetTargetGear(DesiredGear, true);
    }

    const float SpeedLimit = DesiredGear < 0 ? MaxReverseSpeedKmh : MaxSpeedKmh;
    const float SpeedTaper = FMath::Clamp((FMath::Max(1.f, SpeedLimit) - SpeedKmh()) / 7.f, 0.f, 1.f);
    const float DeliveredThrottle = FMath::Abs(Throttle) * SpeedTaper * (Brake > 0.05f ? 0.f : 1.f);
    const bool bCoasting = bOccupied && FMath::Abs(RequestedThrottle) < 0.05f && SpeedCm > 120.f;
    const float EffectiveBrake = FMath::Max(Brake, bCoasting ? 0.025f : 0.f);
    Movement->SetThrottleInput(DeliveredThrottle);
    Movement->SetSteeringInput(bOccupied ? RequestedSteering : 0.f);
    Movement->SetBrakeInput(EffectiveBrake);
    Movement->SetHandbrakeInput(!bOccupied);

    // Mechanical shaft power estimate plus controller/auxiliary losses. At a stall,
    // current still costs energy even though shaft RPM is zero.
    const float RPM = FMath::Max(0.f, Movement->GetEngineRotationSpeed());
    const float TorqueNm = Movement->EngineSetup.GetTorqueFromRPM(RPM) * DeliveredThrottle;
    const float ShaftKW = TorqueNm * RPM * (2.f * PI / 60.f) / 1000.f;
    const float DrawKW = bOccupied ? 0.018f + ShaftKW / 0.88f + 0.30f * DeliveredThrottle * DeliveredThrottle : 0.f;

    // Credit only a fraction of kinetic energy actually lost while wheels are grounded
    // and braking. This bounds recovery and prevents battery gain from airborne wheels.
    float RegenKW = 0.f;
    if (bOccupied && Battery < 99.99f && EffectiveBrake > 0.f && DeliveredThrottle < 0.01f
        && SpeedCm > 100.f && HasWheelContact() && DeltaSeconds > SMALL_NUMBER)
    {
        const float KineticLossJ = 0.5f * Movement->Mass
            * FMath::Max(0.f, FMath::Square(PreviousSpeedCm / 100.f) - FMath::Square(SpeedCm / 100.f));
        const float BrakeShare = FMath::Clamp(EffectiveBrake * 4.f, 0.f, 1.f);
        RegenKW = FMath::Min(3.f * BrakeShare, KineticLossJ * 0.55f / (DeltaSeconds * 1000.f));
    }
    MotorPowerKW = DrawKW - RegenKW;
    Battery = FMath::Clamp(Battery - MotorPowerKW * DeltaSeconds / (3600.f * FMath::Max(0.1f, BatteryCapacityKWh)) * 100.f, 0.f, 100.f);
    PreviousSpeedCm = SpeedCm;
}

void AGRBikePawn::Tick(float DeltaSeconds)
{
    Super::Tick(DeltaSeconds);
    UpdateDriveAndEnergy(DeltaSeconds);
    UpdateBalance(DeltaSeconds);
    DiagnosticAge += DeltaSeconds;
    if (bDiagnostics && DiagnosticAge <= 35.f && DiagnosticAge >= NextDiagnosticTime)
    {
        NextDiagnosticTime = DiagnosticAge + 1.f;
        if (UChaosWheeledVehicleMovementComponent* Movement = BikeMovement())
        {
            UE_LOG(LogTemp, Display, TEXT("GR_BIKE t=%.1f loc=%s rot=%s sim=%d valid=%d awake=%d ctrl=%s request=%.2f throttle=%.2f brake=%.2f hand=%d rpm=%.1f gear=%d speed=%.1f mass=%.1f wheelcount=%d"),
                DiagnosticAge, *GetActorLocation().ToCompactString(), *GetActorRotation().ToCompactString(),
                GetMesh()->IsSimulatingPhysics(), Movement->HasValidPhysicsState(), GetMesh()->IsAnyRigidBodyAwake(),
                *GetNameSafe(GetController()), RequestedThrottle, Movement->GetThrottleInput(), Movement->GetBrakeInput(),
                Movement->GetHandbrakeInput(), Movement->GetEngineRotationSpeed(), Movement->GetCurrentGear(),
                Movement->GetForwardSpeed(), Movement->Mass, Movement->GetNumWheels());
            for (int32 Index = 0; Index < Movement->GetNumWheels(); ++Index)
            {
                const FWheelStatus& State = Movement->GetWheelState(Index);
                UE_LOG(LogTemp, Display, TEXT("GR_BIKE_WHEEL %d contact=%d torque=%.2f brake=%.2f spring=%.2f length=%.2f point=%s"),
                    Index, State.bInContact, State.DriveTorque, State.BrakeTorque, State.SpringForce,
                    State.NormalizedSuspensionLength, *State.ContactPoint.ToCompactString());
            }
        }
    }
    FollowCamera->SetFieldOfView(FMath::FInterpTo(FollowCamera->FieldOfView,
        82.f + FMath::Clamp(SpeedKmh() / 72.f, 0.f, 1.f) * 7.f, DeltaSeconds, 2.f));
}
