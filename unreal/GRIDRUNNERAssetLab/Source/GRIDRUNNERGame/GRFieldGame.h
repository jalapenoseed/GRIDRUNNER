#pragma once
#include "CoreMinimal.h"
#include "GameFramework/GameModeBase.h"
#include "GameFramework/PlayerController.h"
#include "GameFramework/HUD.h"
#include "GameFramework/SaveGame.h"
#include "GRFieldGame.generated.h"

class AGRBikePawn;
class AGRDronePawn;
class ACharacter;
class UStaticMeshComponent;
class UPointLightComponent;
class UNiagaraComponent;
class UAudioComponent;

UCLASS()
class GRIDRUNNERGAME_API UGRFieldSave : public USaveGame
{
    GENERATED_BODY()
public:
    UPROPERTY() int32 Stage = 0;
    UPROPERTY() bool bSignalScanned = false;
    UPROPERTY() float BikeBattery = 100.f;
};

UCLASS()
class GRIDRUNNERGAME_API AGRRelay : public AActor
{
    GENERATED_BODY()
public:
    AGRRelay();
    virtual void BeginPlay() override;
    virtual void Tick(float DeltaSeconds) override;
    UPROPERTY(EditAnywhere, BlueprintReadWrite) int32 RelayIndex = 0;
    UPROPERTY(EditAnywhere, BlueprintReadWrite) FString Title;
    UPROPERTY(EditAnywhere, BlueprintReadWrite) bool bPowered = false;
    UPROPERTY(VisibleAnywhere) TObjectPtr<UStaticMeshComponent> Housing;
    UPROPERTY(VisibleAnywhere) TObjectPtr<UPointLightComponent> Light;
    UPROPERTY(VisibleAnywhere) TObjectPtr<UNiagaraComponent> Sparks;
    void SetPowered(bool bOn);
    float NextFaultTime = 0.f;
};

UCLASS()
class GRIDRUNNERGAME_API AGRPlayerController : public APlayerController
{
    GENERATED_BODY()
public:
    AGRPlayerController();
    virtual void BeginPlay() override;
    virtual void SetupInputComponent() override;
    virtual void Tick(float DeltaSeconds) override;
    void Interact();
    void ToggleBike();
    void ToggleDrone();
    void ToggleScanner();
    void ToggleNightVision();
    void ToggleHelp();
    void ToggleTime();
    void ReturnDrone();
    void JumpPressed();
    void JumpReleased();
    void QuitGame();
    void SaveProgress();
    void LoadProgress();
    FString ModeName() const;
    FString Objective() const;
    FString Prompt() const;
    UPROPERTY() TObjectPtr<ACharacter> Walker;
    UPROPERTY() TObjectPtr<AGRBikePawn> Bike;
    UPROPERTY() TObjectPtr<AGRDronePawn> Drone;
    UPROPERTY() TArray<TObjectPtr<AGRRelay>> Relays;
    UPROPERTY() TObjectPtr<UAudioComponent> Wind;
    UPROPERTY() TObjectPtr<UAudioComponent> Birds;
    UPROPERTY() TObjectPtr<UAudioComponent> Rain;
    int32 Stage = 0;
    float ScanProgress = 0.f;
    bool bSignalScanned = false;
    bool bScanner = false;
    bool bNightVision = false;
    bool bNight = false;
    bool bHelp = true;
    FString Notice;
    float NoticeTime = 0.f;
private:
    float Axis(FKey Positive, FKey Negative, FKey Analog) const;
    void Message(const FString& Text);
    void UpdateVision();
    void SmokeTick(float DeltaSeconds);
    void SmokeCheck(bool Condition, const FString& Label);
    void FinishSmoke();
    bool bSmoke = false;
    int32 SmokePhase = 0;
    float SmokeTime = 0.f;
    FVector SmokeStart = FVector::ZeroVector;
    TArray<FString> SmokePassed;
    TArray<FString> SmokeErrors;
    float SmokeThrottle = 0.f;
    float SmokeDroneForward = 0.f;
};

UCLASS()
class GRIDRUNNERGAME_API AGRHUD : public AHUD
{
    GENERATED_BODY()
public:
    virtual void DrawHUD() override;
    virtual void NotifyHitBoxClick(FName BoxName) override;
};

UCLASS()
class GRIDRUNNERGAME_API AGRGameMode : public AGameModeBase
{
    GENERATED_BODY()
public:
    AGRGameMode();
};
