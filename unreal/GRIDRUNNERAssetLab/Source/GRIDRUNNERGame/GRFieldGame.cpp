#include "GRFieldGame.h"
#include "GRBikePawn.h"
#include "GRDronePawn.h"
#include "Camera/CameraComponent.h"
#include "Components/AudioComponent.h"
#include "Components/BoxComponent.h"
#include "Components/CapsuleComponent.h"
#include "Components/PointLightComponent.h"
#include "Components/StaticMeshComponent.h"
#include "Components/DirectionalLightComponent.h"
#include "Engine/Canvas.h"
#include "Engine/StaticMesh.h"
#include "Materials/MaterialInterface.h"
#include "Engine/DirectionalLight.h"
#include "Engine/Engine.h"
#include "Engine/World.h"
#include "EngineUtils.h"
#include "GameFramework/Character.h"
#include "GameFramework/CharacterMovementComponent.h"
#include "InputCoreTypes.h"
#include "Kismet/GameplayStatics.h"
#include "Misc/CommandLine.h"
#include "Misc/FileHelper.h"
#include "Misc/Paths.h"
#include "Misc/Parse.h"
#include "HAL/FileManager.h"
#include "NiagaraComponent.h"
#include "NiagaraSystem.h"
#include "Sound/SoundBase.h"
#include "Serialization/JsonSerializer.h"
#include "UObject/ConstructorHelpers.h"
#include "UnrealClient.h"

AGRRelay::AGRRelay()
{
    PrimaryActorTick.bCanEverTick = true;
    Housing = CreateDefaultSubobject<UStaticMeshComponent>(TEXT("RelayHousing"));
    SetRootComponent(Housing);
    static ConstructorHelpers::FObjectFinder<UStaticMesh> Cube(TEXT("/Engine/BasicShapes/Cube.Cube"));
    Housing->SetStaticMesh(Cube.Object);
    Housing->SetRelativeScale3D(FVector(.55f,.45f,1.5f));
    Housing->SetCollisionProfileName(TEXT("BlockAll"));
    static ConstructorHelpers::FObjectFinder<UMaterialInterface> Metal(TEXT("/Game/GRIDRUNNER/Materials/MI_GR_PaintedSteel.MI_GR_PaintedSteel"));
    if (Metal.Succeeded()) Housing->SetMaterial(0,Metal.Object);
    Light=CreateDefaultSubobject<UPointLightComponent>(TEXT("StatusLight"));
    Light->SetupAttachment(Housing);
    Light->SetRelativeLocation(FVector(-65,0,60));
    Light->SetAttenuationRadius(300);
    Light->SetCastShadows(false);
    Sparks=CreateDefaultSubobject<UNiagaraComponent>(TEXT("FaultSparks"));
    Sparks->SetupAttachment(Housing);
    Sparks->SetRelativeLocation(FVector(-55,0,50));
    Sparks->SetAutoActivate(false);
    static ConstructorHelpers::FObjectFinder<UNiagaraSystem> Fx(TEXT("/Game/Sparks_Embers/Niagara/NS_Sparks08.NS_Sparks08"));
    if(Fx.Succeeded()) Sparks->SetAsset(Fx.Object);
}
void AGRRelay::BeginPlay(){Super::BeginPlay(); SetPowered(bPowered);}
void AGRRelay::Tick(float Dt)
{
    Super::Tick(Dt);
    if (!bPowered && RelayIndex==0) { Light->SetIntensity(120+180*FMath::Max(0.f,FMath::Sin(GetWorld()->GetTimeSeconds()*18)));
        if(GetWorld()->GetTimeSeconds()>=NextFaultTime){Sparks->Activate(true);NextFaultTime=GetWorld()->GetTimeSeconds()+1.25f;} }
}
void AGRRelay::SetPowered(bool bOn)
{
    bPowered=bOn;
    Light->SetLightColor(bOn?FLinearColor(.05f,.8f,1.f):FLinearColor(1.f,.25f,.03f));
    Light->SetIntensity(bOn?900.f:200.f);
    if (!bOn && RelayIndex==0) Sparks->Activate(true); else Sparks->Deactivate();
}

AGRGameMode::AGRGameMode()
{
    static ConstructorHelpers::FClassFinder<APawn> Character(TEXT("/Game/ThirdPerson/Blueprints/BP_ThirdPersonCharacter"));
    if (Character.Succeeded()) DefaultPawnClass=Character.Class;
    PlayerControllerClass=AGRPlayerController::StaticClass();
    HUDClass=AGRHUD::StaticClass();
}
AGRPlayerController::AGRPlayerController(){PrimaryActorTick.bCanEverTick=true;}
void AGRPlayerController::BeginPlay()
{
    Super::BeginPlay();
    bSmoke=FParse::Param(FCommandLine::Get(),TEXT("GRSmokeTest"));
    Walker=Cast<ACharacter>(GetPawn());
    for(TActorIterator<AGRBikePawn> It(GetWorld());It;++It){Bike=*It;break;}
    for(TActorIterator<AGRRelay> It(GetWorld());It;++It) Relays.Add(*It);
    Relays.Sort([](const AGRRelay& A,const AGRRelay& B){return A.RelayIndex<B.RelayIndex;});
    LoadProgress();
    bShowMouseCursor=false;
    bEnableTouchEvents=true;
    SetInputMode(FInputModeGameOnly());
    UpdateVision();
    auto Ambient=[this](const TCHAR* Path,float Volume)->UAudioComponent*
    {
        USoundBase* Sound=LoadObject<USoundBase>(nullptr,Path);
        return Sound?UGameplayStatics::SpawnSound2D(this,Sound,Volume,1.f,0.f,nullptr,true,false):nullptr;
    };
    Wind=Ambient(TEXT("/Game/Free_Sounds_Pack/cue/Ambient_Wind_Loop_1_Cue.Ambient_Wind_Loop_1_Cue"),.12f);
    Birds=Ambient(TEXT("/Game/Free_Sounds_Pack/cue/Ambient_Birds_Loop_04_Cue.Ambient_Birds_Loop_04_Cue"),.065f);
    Rain=Ambient(TEXT("/Game/Free_Sounds_Pack/cue/Ambient_Rain_Moderate_Loop_1_Cue.Ambient_Rain_Moderate_Loop_1_Cue"),0.f);
    Message(TEXT("GHOST SIGNAL // Restore the field relay. H hides controls."));
    UE_LOG(LogTemp,Display,TEXT("GR_FIELD_BEGIN Walker=%s Bike=%s Relays=%d"),*GetNameSafe(Walker),*GetNameSafe(Bike),Relays.Num());
}
void AGRPlayerController::SetupInputComponent()
{
    Super::SetupInputComponent();
    InputComponent->BindKey(EKeys::E,IE_Pressed,this,&AGRPlayerController::Interact);
    InputComponent->BindKey(EKeys::B,IE_Pressed,this,&AGRPlayerController::ToggleBike);
    InputComponent->BindKey(EKeys::F,IE_Pressed,this,&AGRPlayerController::ToggleDrone);
    InputComponent->BindKey(EKeys::R,IE_Pressed,this,&AGRPlayerController::ReturnDrone);
    InputComponent->BindKey(EKeys::Tab,IE_Pressed,this,&AGRPlayerController::ToggleScanner);
    InputComponent->BindKey(EKeys::N,IE_Pressed,this,&AGRPlayerController::ToggleNightVision);
    InputComponent->BindKey(EKeys::H,IE_Pressed,this,&AGRPlayerController::ToggleHelp);
    InputComponent->BindKey(EKeys::T,IE_Pressed,this,&AGRPlayerController::ToggleTime);
    InputComponent->BindKey(EKeys::SpaceBar,IE_Pressed,this,&AGRPlayerController::JumpPressed);
    InputComponent->BindKey(EKeys::SpaceBar,IE_Released,this,&AGRPlayerController::JumpReleased);
    InputComponent->BindKey(EKeys::Escape,IE_Pressed,this,&AGRPlayerController::QuitGame);
    InputComponent->BindKey(EKeys::Gamepad_FaceButton_Left,IE_Pressed,this,&AGRPlayerController::Interact);
    InputComponent->BindKey(EKeys::Gamepad_FaceButton_Top,IE_Pressed,this,&AGRPlayerController::ToggleDrone);
    InputComponent->BindKey(EKeys::Gamepad_FaceButton_Right,IE_Pressed,this,&AGRPlayerController::ToggleBike);
    InputComponent->BindKey(EKeys::Gamepad_FaceButton_Bottom,IE_Pressed,this,&AGRPlayerController::JumpPressed);
    InputComponent->BindKey(EKeys::Gamepad_FaceButton_Bottom,IE_Released,this,&AGRPlayerController::JumpReleased);
    InputComponent->BindKey(EKeys::Gamepad_LeftShoulder,IE_Pressed,this,&AGRPlayerController::ToggleScanner);
    InputComponent->BindKey(EKeys::Gamepad_RightShoulder,IE_Pressed,this,&AGRPlayerController::ToggleNightVision);
    InputComponent->BindKey(EKeys::Gamepad_Special_Right,IE_Pressed,this,&AGRPlayerController::ToggleHelp);
}
float AGRPlayerController::Axis(FKey Positive,FKey Negative,FKey Analog) const
{
    const float A=GetInputAnalogKeyState(Analog);
    return FMath::Clamp((IsInputKeyDown(Positive)?1.f:0.f)-(IsInputKeyDown(Negative)?1.f:0.f)+(FMath::Abs(A)>.12f?A:0.f),-1.f,1.f);
}
void AGRPlayerController::Tick(float Dt)
{
    Super::Tick(Dt);
    if(!Walker) Walker=Cast<ACharacter>(GetPawn());
    if(NoticeTime>0) NoticeTime-=Dt;
    float Fwd=Axis(EKeys::W,EKeys::S,EKeys::Gamepad_LeftY);
    float Right=Axis(EKeys::D,EKeys::A,EKeys::Gamepad_LeftX);
    float MX=0,MY=0; GetInputMouseDelta(MX,MY);
    const float RX=GetInputAnalogKeyState(EKeys::Gamepad_RightX);
    const float RY=GetInputAnalogKeyState(EKeys::Gamepad_RightY);
    if(GetPawn()==Walker && Walker)
    {
        FRotator View=GetControlRotation();
        View.Yaw+=MX*.12f+(FMath::Abs(RX)>.12f?RX*110*Dt:0);
        View.Pitch=FMath::Clamp(FRotator::NormalizeAxis(View.Pitch-MY*.12f+(FMath::Abs(RY)>.12f?RY*85*Dt:0)),-75.f,70.f);
        SetControlRotation(View);
        const FRotator Heading(0,View.Yaw,0);
        Walker->AddMovementInput(Heading.Vector(),bSmoke?(SmokePhase==1?1.f:0.f):Fwd);
        Walker->AddMovementInput(FRotationMatrix(Heading).GetUnitAxis(EAxis::Y),bSmoke?0.f:Right);
        Walker->GetCharacterMovement()->MaxWalkSpeed=IsInputKeyDown(EKeys::LeftShift)?750.f:480.f;
    }
    else if(GetPawn()==Bike && Bike)
    {
        SetControlRotation(FRotator(-10.f,Bike->GetActorRotation().Yaw,0));
        float Throttle=Fwd;
        const float RT=GetInputAnalogKeyState(EKeys::Gamepad_RightTriggerAxis);
        if(RT>.05f) Throttle=RT;
        const float Brake=IsInputKeyDown(EKeys::SpaceBar)?1.f:GetInputAnalogKeyState(EKeys::Gamepad_LeftTriggerAxis);
        Bike->SetDriveInput(bSmoke?SmokeThrottle:Throttle,bSmoke?0.f:Right,bSmoke?(SmokePhase==4?1.f:0.f):Brake);
    }
    else if(GetPawn()==Drone && Drone)
    {
        const float Up=FMath::Clamp((IsInputKeyDown(EKeys::SpaceBar)?1.f:0.f)-(IsInputKeyDown(EKeys::LeftControl)?1.f:0.f)+GetInputAnalogKeyState(EKeys::Gamepad_RightTriggerAxis)-GetInputAnalogKeyState(EKeys::Gamepad_LeftTriggerAxis),-1.f,1.f);
        const float Yaw=FMath::Clamp((IsInputKeyDown(EKeys::E)?1.f:0.f)-(IsInputKeyDown(EKeys::Q)?1.f:0.f)+RX+MX*.075f,-1.f,1.f);
        Drone->SetFlightInput(bSmoke?SmokeDroneForward:Fwd,bSmoke?0.f:Right,bSmoke?0.f:Up,bSmoke?0.f:Yaw,bSmoke?0.f:RY-MY*.03f);
        if(bScanner && Stage>=2)
        {
            AGRRelay* Target=Relays.FindByPredicate([](const TObjectPtr<AGRRelay>& R){return R && R->RelayIndex==2;})?*Relays.FindByPredicate([](const TObjectPtr<AGRRelay>& R){return R && R->RelayIndex==2;}):nullptr;
            if(Target && FVector::Dist(Drone->GetActorLocation(),Target->GetActorLocation())<1600)
            {
                ScanProgress=FMath::Min(100.f,ScanProgress+Dt*25.f);
                if(ScanProgress>=100 && !bSignalScanned){bSignalScanned=true; SaveProgress(); Message(TEXT("Carrier decoded. Return to the signal terminal."));}
            }
        }
        if(Drone->HasLanded()) ReturnDrone();
    }
    if(bSmoke) SmokeTick(Dt);
}
void AGRPlayerController::Message(const FString& Text){Notice=Text;NoticeTime=5.f;}
void AGRPlayerController::JumpPressed(){if(GetPawn()==Walker && Walker)Walker->Jump();}
void AGRPlayerController::JumpReleased(){if(Walker)Walker->StopJumping();}
void AGRPlayerController::ToggleHelp(){bHelp=!bHelp;}
void AGRPlayerController::ToggleScanner(){bScanner=!bScanner;Message(bScanner?TEXT("Scanner online"):TEXT("Scanner hidden"));}
void AGRPlayerController::ToggleNightVision(){bNightVision=!bNightVision;UpdateVision();}
void AGRPlayerController::UpdateVision()
{
    if(!GetPawn())return;
    TArray<UCameraComponent*> Cameras; GetPawn()->GetComponents(Cameras);
    for(UCameraComponent* C:Cameras)
    {
        C->PostProcessBlendWeight=1;
        C->PostProcessSettings.bOverride_AutoExposureMethod=true;
        C->PostProcessSettings.AutoExposureMethod=AEM_Manual;
        C->PostProcessSettings.bOverride_AutoExposureApplyPhysicalCameraExposure=true;
        C->PostProcessSettings.AutoExposureApplyPhysicalCameraExposure=false;
        C->PostProcessSettings.bOverride_AutoExposureBias=true;
        C->PostProcessSettings.AutoExposureBias=bNightVision?5.f:0.f;
        C->PostProcessSettings.bOverride_SceneColorTint=true;
        C->PostProcessSettings.SceneColorTint=bNightVision?FLinearColor(.3f,1.f,.45f):FLinearColor::White;
    }
}
void AGRPlayerController::ToggleTime()
{
    bNight=!bNight;
    for(TActorIterator<ADirectionalLight> It(GetWorld());It;++It)
    {
        It->SetActorRotation(FRotator(bNight?-4.f:-18.f,-35,0));
        It->GetLightComponent()->SetIntensity(bNight?.035f:2.8f);
    }
    if(Birds) Birds->AdjustVolume(2,bNight?0.f:.065f);
    if(Rain) Rain->AdjustVolume(2,bNight?.045f:0.f);
    Message(bNight?TEXT("Night conditions"):TEXT("Day conditions"));
}
void AGRPlayerController::ToggleBike()
{
    if(!Bike || !Walker){Message(TEXT("Bike unavailable"));return;}
    if(GetPawn()==Drone){Message(TEXT("Return SCOUT before mounting"));return;}
    if(GetPawn()==Bike)
    {
        if(Bike->SpeedKmh()>5.f){Message(TEXT("Brake to walking speed before dismounting"));return;}
        FVector Exit=Bike->GetActorLocation()+Bike->GetActorRightVector()*170+FVector(0,0,100);
        FCollisionQueryParams Params;Params.AddIgnoredActor(Bike);Params.AddIgnoredActor(Walker);
        FHitResult Floor;
        if(GetWorld()->LineTraceSingleByChannel(Floor,Exit+FVector(0,0,300),Exit-FVector(0,0,700),ECC_Visibility,Params))
            Exit=Floor.ImpactPoint+FVector(0,0,Walker->GetCapsuleComponent()->GetScaledCapsuleHalfHeight()+5);
        const FCollisionShape Shape=FCollisionShape::MakeCapsule(Walker->GetCapsuleComponent()->GetScaledCapsuleRadius(),Walker->GetCapsuleComponent()->GetScaledCapsuleHalfHeight());
        if(GetWorld()->OverlapBlockingTestByChannel(Exit,FQuat::Identity,ECC_Pawn,Shape,Params)){Message(TEXT("Dismount space blocked. Move to open ground."));return;}
        Walker->SetActorLocation(Exit,false,nullptr,ETeleportType::TeleportPhysics);
        Walker->SetActorHiddenInGame(false);Walker->SetActorEnableCollision(true);
        Walker->GetCharacterMovement()->SetMovementMode(MOVE_Walking);
        Possess(Walker);SetControlRotation(Bike->GetActorRotation());UpdateVision();SaveProgress();
        Message(TEXT("On foot"));return;
    }
    if(FVector::Dist(Walker->GetActorLocation(),Bike->GetActorLocation())>400){Message(TEXT("Approach the bike to mount"));return;}
    if(!Bike->IsDriveReady()){Message(TEXT("Bike rig is not ready. Check asset installation."));return;}
    Walker->GetCharacterMovement()->StopMovementImmediately();
    Walker->GetCharacterMovement()->DisableMovement();Walker->SetActorHiddenInGame(true);Walker->SetActorEnableCollision(false);
    Possess(Bike);UpdateVision();Message(TEXT("Ride // WASD or RT / left stick. Space / LT brakes."));
}
void AGRPlayerController::ToggleDrone()
{
    if(GetPawn()==Drone){ReturnDrone();return;}
    if(GetPawn()!=Walker || !Walker){Message(TEXT("Dismount before deploying SCOUT"));return;}
    if(Drone && !Drone->HasLanded()){Message(TEXT("SCOUT is returning. Wait for landing."));return;}
    float Battery=Drone?Drone->Battery:100;
    if(Battery<12){Message(TEXT("Recharge SCOUT at a restored relay"));return;}
    TArray<AActor*> Sources; UGameplayStatics::GetAllActorsWithTag(this,TEXT("GR_DroneSource"),Sources);
    if(Sources.Num()<1){Message(TEXT("Approved SCOUT assembly is missing"));return;}
    if(Drone)Drone->Destroy();
    FVector Home=Walker->GetActorLocation()+Walker->GetActorForwardVector()*110;
    FHitResult Floor;FCollisionQueryParams Params;Params.AddIgnoredActor(Walker);
    if(GetWorld()->LineTraceSingleByChannel(Floor,Home+FVector(0,0,100),Home-FVector(0,0,400),ECC_Visibility,Params)) Home=Floor.ImpactPoint+FVector(0,0,22);
    FActorSpawnParameters Spawn; Spawn.SpawnCollisionHandlingOverride=ESpawnActorCollisionHandlingMethod::AdjustIfPossibleButDontSpawnIfColliding;
    Drone=GetWorld()->SpawnActor<AGRDronePawn>(AGRDronePawn::StaticClass(),Home+FVector(0,0,160),FRotator(0,GetControlRotation().Yaw,0),Spawn);
    if(!Drone){Message(TEXT("SCOUT launch area is blocked"));return;}
    Drone->InitializeAssembly(Sources);
    if(Drone->GetAssemblyPartCount()!=19){Drone->Destroy();Drone=nullptr;Message(TEXT("SCOUT assembly validation failed"));return;}
    if(Floor.bBlockingHit)Home.Z=Floor.ImpactPoint.Z+Drone->CollisionRoot->GetScaledBoxExtent().Z+3;
    Drone->Battery=Battery;Drone->SetHomeLocation(Home);
    Walker->GetCharacterMovement()->StopMovementImmediately();Possess(Drone);UpdateVision();
    Message(TEXT("SCOUT // Tilt WASD, yaw Q/E, rise Space, descend Ctrl"));
}
void AGRPlayerController::ReturnDrone()
{
    if(Drone)Drone->RequestReturn();
    if(GetPawn()==Drone && Walker){Possess(Walker);UpdateVision();Message(TEXT("SCOUT returning to launch position"));}
}
void AGRPlayerController::Interact()
{
    if(GetPawn()!=Walker || !Walker)return;
    AGRRelay* Near=nullptr;
    for(AGRRelay* R:Relays)if(R && FVector::Dist(R->GetActorLocation(),Walker->GetActorLocation())<350){Near=R;break;}
    if(!Near){ToggleBike();return;}
    if(Near->RelayIndex<Stage)
    {
        if(Bike && FVector::Dist(Bike->GetActorLocation(),Near->GetActorLocation())<650)Bike->AddBattery(100);
        if(Drone && Drone->HasLanded())Drone->Battery=100;
        Message(TEXT("Relay online. Nearby equipment recharged."));SaveProgress();return;
    }
    if(Near->RelayIndex!=Stage){Message(TEXT("Restore the upstream relay first"));return;}
    if(Stage==2 && !bSignalScanned){Message(TEXT("Deploy SCOUT and scan this signal source with Tab / LB"));return;}
    Near->SetPowered(true);++Stage;SaveProgress();
    Message(Stage==1?TEXT("Relay restored. Follow the corridor to recover the power cell."):Stage==2?TEXT("Power cell recovered. Trace the carrier at the far relay."):TEXT("GHOST SIGNAL DECODED // Field route complete"));
}
void AGRPlayerController::SaveProgress()
{
    UGRFieldSave* Save=Cast<UGRFieldSave>(UGameplayStatics::CreateSaveGameObject(UGRFieldSave::StaticClass()));
    Save->Stage=Stage;Save->bSignalScanned=bSignalScanned;Save->BikeBattery=Bike?Bike->Battery:100;
    UGameplayStatics::SaveGameToSlot(Save,bSmoke?TEXT("GR_Field_Smoke"):TEXT("GR_Field_v1"),0);
}
void AGRPlayerController::LoadProgress()
{
    if(!bSmoke)
    {
        if(UGRFieldSave* Save=Cast<UGRFieldSave>(UGameplayStatics::LoadGameFromSlot(TEXT("GR_Field_v1"),0)))
        {Stage=FMath::Clamp(Save->Stage,0,3);bSignalScanned=Save->bSignalScanned;if(Bike)Bike->Battery=FMath::Clamp(Save->BikeBattery,0.f,100.f);}
    }
    for(AGRRelay* R:Relays)R->SetPowered(R->RelayIndex<Stage);
}
void AGRPlayerController::QuitGame(){SaveProgress();ConsoleCommand(TEXT("quit"));}
FString AGRPlayerController::ModeName() const{return GetPawn()==Drone?TEXT("SCOUT-01"):GetPawn()==Bike?TEXT("RIDE"):TEXT("ON FOOT");}
FString AGRPlayerController::Objective() const
{
    switch(Stage){case 0:return TEXT("01  Restore the field relay");case 1:return TEXT("02  Recover the relay power cell");case 2:return bSignalScanned?TEXT("03  Return to the signal terminal"):TEXT("03  Reach the far relay and scan with SCOUT");default:return TEXT("CARRIER DECODED  //  Free exploration");}
}
FString AGRPlayerController::Prompt() const
{
    if(GetPawn()==Walker && Walker)
    {
        for(AGRRelay* R:Relays)if(R && FVector::Dist(R->GetActorLocation(),Walker->GetActorLocation())<350)return TEXT("E / X   ")+R->Title;
        if(Bike && FVector::Dist(Bike->GetActorLocation(),Walker->GetActorLocation())<400)return TEXT("E / X   Mount bike");
    }
    return FString();
}

void AGRPlayerController::SmokeCheck(bool Condition,const FString& Label)
{
    (Condition?SmokePassed:SmokeErrors).Add(Label);
    UE_LOG(LogTemp,Display,TEXT("GR_SMOKE %s %s"),Condition?TEXT("PASS"):TEXT("FAIL"),*Label);
}
void AGRPlayerController::SmokeTick(float Dt)
{
    SmokeTime+=FMath::Min(Dt,.25f);
    auto Advance=[this](){++SmokePhase;SmokeTime=0;};
    switch(SmokePhase)
    {
    case 0:if(SmokeTime>10){SmokeCheck(Walker && GetPawn()==Walker,TEXT("walking pawn possessed"));SmokeCheck(Bike && Bike->IsDriveReady(),TEXT("Chaos bike initialized"));SmokeCheck(Relays.Num()==3,TEXT("three relays loaded"));SmokeCheck(Wind && Wind->IsPlaying(),TEXT("wind ambience playing"));if(Relays.Num()>0)Relays[0]->SetPowered(false);SmokeCheck(Relays.Num()>0 && Relays[0]->Sparks->GetAsset() && Relays[0]->Sparks->IsActive(),TEXT("relay fault Niagara active"));if(!Walker||!Bike||Relays.Num()!=3){FinishSmoke();return;}SmokeStart=Walker->GetActorLocation();Advance();}break;
    case 1:if(SmokeTime>2){SmokeCheck(FVector::Dist2D(SmokeStart,Walker->GetActorLocation())>100,TEXT("walking moves through world"));Walker->SetActorLocation(Bike->GetActorLocation()+FVector(0,180,120));ToggleBike();SmokeCheck(GetPawn()==Bike,TEXT("bike possessed"));SmokeStart=Bike->GetActorLocation();SmokeThrottle=1;Advance();}break;
    case 2:if(SmokeTime>5){SmokeCheck(FVector::Dist2D(SmokeStart,Bike->GetActorLocation())>150,TEXT("Chaos wheels propel bike"));SmokeThrottle=0;FScreenshotRequest::RequestScreenshot(FPaths::ProjectSavedDir()/TEXT("Screenshots/Field_Bike.png"),false,false);Advance();}break;
    case 3:Advance();break;
    case 4:if(SmokeTime>3){ToggleBike();SmokeCheck(GetPawn()==Walker,TEXT("safe bike dismount"));if(GetPawn()!=Walker){FinishSmoke();return;}ToggleDrone();SmokeCheck(GetPawn()==Drone && Drone,TEXT("SCOUT possessed"));if(!Drone){FinishSmoke();return;}SmokeStart=Drone->GetActorLocation();SmokeDroneForward=.65f;Advance();}break;
    case 5:if(SmokeTime>3){SmokeCheck(FVector::Dist(SmokeStart,Drone->GetActorLocation())>120,TEXT("SCOUT thrust moves assembly"));SmokeCheck(Drone->Battery<100,TEXT("SCOUT energy consumed"));SmokeDroneForward=0;ToggleScanner();ToggleNightVision();FScreenshotRequest::RequestScreenshot(FPaths::ProjectSavedDir()/TEXT("Screenshots/Field_SCOUT.png"),false,false);Advance();}break;
    case 6:if(SmokeTime>1 && GetPawn()==Drone){ReturnDrone();SmokeCheck(GetPawn()==Walker && Drone->bReturning,TEXT("SCOUT return initiated"));}if((Drone->HasLanded() && SmokeTime>1) || SmokeTime>25){SmokeCheck(Drone->HasLanded(),TEXT("SCOUT return lands"));for(int32 I=0;I<2;++I){Walker->SetActorLocation(Relays[I]->GetActorLocation()+FVector(-180,0,120));Interact();}SmokeCheck(Stage==2,TEXT("relay and power cell progression"));Walker->SetActorLocation(Relays[2]->GetActorLocation()+FVector(-200,0,120));ToggleDrone();bScanner=true;Advance();}break;
    case 7:if(SmokeTime>5){SmokeCheck(bSignalScanned,TEXT("proximity scan decodes carrier"));ReturnDrone();Interact();SmokeCheck(Stage==3,TEXT("final relay completes route"));UGRFieldSave* Save=Cast<UGRFieldSave>(UGameplayStatics::LoadGameFromSlot(TEXT("GR_Field_Smoke"),0));SmokeCheck(Save && Save->Stage==3 && Save->bSignalScanned,TEXT("progress persists to save"));FScreenshotRequest::RequestScreenshot(FPaths::ProjectSavedDir()/TEXT("Screenshots/Field_Complete.png"),false,false);Advance();}break;
    case 8:if(SmokeTime>2)FinishSmoke();break;
    default:break;
    }
}
void AGRPlayerController::FinishSmoke()
{
    if(SmokePhase==99)return;SmokePhase=99;
    TSharedRef<FJsonObject> Report=MakeShared<FJsonObject>();
    Report->SetBoolField(TEXT("passed"),SmokeErrors.Num()==0);
    Report->SetStringField(TEXT("map"),GetWorld()->GetMapName());
    TArray<TSharedPtr<FJsonValue>> Passed,Errors;
    for(const FString& S:SmokePassed)Passed.Add(MakeShared<FJsonValueString>(S));
    for(const FString& S:SmokeErrors)Errors.Add(MakeShared<FJsonValueString>(S));
    Report->SetArrayField(TEXT("checks_passed"),Passed);Report->SetArrayField(TEXT("checks_failed"),Errors);
    FString Json;auto Writer=TJsonWriterFactory<>::Create(&Json);FJsonSerializer::Serialize(Report,Writer);
    const FString Path=FPaths::ProjectSavedDir()/TEXT("Validation/field_runtime_smoke.json");
    IFileManager::Get().MakeDirectory(*FPaths::GetPath(Path),true);FFileHelper::SaveStringToFile(Json,*Path);
    UE_LOG(LogTemp,Display,TEXT("GR_SMOKE_COMPLETE %s"),*Json);
    ConsoleCommand(TEXT("quit"));
}

void AGRHUD::DrawHUD()
{
    Super::DrawHUD();if(!Canvas)return;
    AGRPlayerController* PC=Cast<AGRPlayerController>(PlayerOwner);if(!PC)return;
    const float W=Canvas->ClipX,H=Canvas->ClipY,S=FMath::Clamp(W/1280.f,.65f,1.5f);
    const FLinearColor Cyan(.25f,.9f,1),Muted(.64f,.71f,.72f),White(.92f,.94f,.92f);
    DrawRect(FLinearColor(.012f,.022f,.025f,.84f),20*S,20*S,480*S,83*S);
    DrawRect(Cyan,20*S,20*S,3*S,83*S);
    DrawText(TEXT("GRIDRUNNER  /  GHOST SIGNAL"),Muted,36*S,28*S,nullptr,.95f*S);
    DrawText(PC->ModeName(),Cyan,36*S,47*S,nullptr,1.35f*S);
    DrawText(PC->Objective(),White,36*S,77*S,nullptr,.96f*S);
    FString Telemetry;
    if(PC->GetPawn()==PC->Bike && PC->Bike)Telemetry=FString::Printf(TEXT("%03.0f km/h    BATTERY %.0f%%    %.1f kW"),PC->Bike->SpeedKmh(),PC->Bike->Battery,PC->Bike->MotorPowerKW);
    if(PC->GetPawn()==PC->Drone && PC->Drone)Telemetry=FString::Printf(TEXT("BATTERY %.0f%%    ALT %.1fm    %.1f m/s"),PC->Drone->Battery,(PC->Drone->GetActorLocation().Z-PC->Drone->HomeLocation.Z)/100,PC->Drone->GetVelocity().Size()/100);
    if(!Telemetry.IsEmpty())DrawText(Telemetry,Cyan,36*S,112*S,nullptr,1.1f*S);
    if(PC->bNightVision)DrawText(TEXT("NV  ACTIVE"),FLinearColor(.4f,1,.5f),W-170*S,28*S,nullptr,1.0f*S);
    if(PC->bScanner && PC->GetPawn()==PC->Drone)
    {
        DrawLine(W*.5f-9*S,H*.5f,W*.5f+9*S,H*.5f,Cyan,1);
        DrawLine(W*.5f,H*.5f-9*S,W*.5f,H*.5f+9*S,Cyan,1);
        DrawText(FString::Printf(TEXT("CARRIER  %.0f%%"),PC->ScanProgress),Cyan,W*.5f-70*S,H*.5f+30*S,nullptr,1.0f*S);
    }
    FString Prompt=PC->Prompt();if(!Prompt.IsEmpty())DrawText(Prompt,White,W*.5f-130*S,H-155*S,nullptr,1.2f*S);
    if(PC->NoticeTime>0)DrawText(PC->Notice,Cyan,30*S,H-183*S,nullptr,.95f*S);
    if(PC->bHelp)
    {
        DrawRect(FLinearColor(.012f,.022f,.025f,.8f),20*S,H-126*S,760*S,105*S);
        DrawText(TEXT("WALK   WASD / left stick   |   Mouse / right stick   |   Space / A jump"),White,32*S,H-115*S,nullptr,.92f*S);
        DrawText(TEXT("RIDE    E / X mount   B / B dismount   |   W / RT throttle   Space / LT brake"),White,32*S,H-94*S,nullptr,.92f*S);
        DrawText(TEXT("SCOUT   F / Y deploy / return   |   WASD tilt   Q/E yaw   Space/Ctrl or RT/LT height"),White,32*S,H-73*S,nullptr,.92f*S);
        DrawText(TEXT("E / X interact   |   Tab / LB scanner   N / RB night vision   T day/night   H help   Esc save/quit"),Muted,32*S,H-49*S,nullptr,.87f*S);
    }
    if(UGameplayStatics::GetPlatformName()==TEXT("Android") || UGameplayStatics::GetPlatformName()==TEXT("IOS"))
    {
        const FName Names[]={TEXT("Use"),TEXT("Drone"),TEXT("Scan"),TEXT("Night")};
        for(int32 I=0;I<4;++I){float X=W-110*S,Y=H-(90+I*58)*S;DrawRect(FLinearColor(0,0,0,.5f),X,Y,90*S,45*S);DrawText(Names[I].ToString(),Cyan,X+8*S,Y+12*S,nullptr,S);AddHitBox(FVector2D(X,Y),FVector2D(90*S,45*S),Names[I],true);}
    }
}
void AGRHUD::NotifyHitBoxClick(FName Name)
{
    Super::NotifyHitBoxClick(Name);AGRPlayerController* PC=Cast<AGRPlayerController>(PlayerOwner);if(!PC)return;
    if(Name==TEXT("Use"))PC->Interact();else if(Name==TEXT("Drone"))PC->ToggleDrone();else if(Name==TEXT("Scan"))PC->ToggleScanner();else if(Name==TEXT("Night"))PC->ToggleNightVision();
}
