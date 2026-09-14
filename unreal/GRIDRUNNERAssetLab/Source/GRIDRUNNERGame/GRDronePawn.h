#pragma once

#include "CoreMinimal.h"
#include "GameFramework/Pawn.h"
#include "GRDronePawn.generated.h"

class UBoxComponent;
class UCameraComponent;
class USceneComponent;
class USpringArmComponent;
class UStaticMeshComponent;

/** Assisted SCOUT flight. Visuals are copies of the approved level assembly. */
UCLASS()
class GRIDRUNNERGAME_API AGRDronePawn : public APawn
{
    GENERATED_BODY()

public:
    AGRDronePawn();
    virtual void Tick(float DeltaSeconds) override;
    virtual FVector GetVelocity() const override;

    // Normalized axes: Forward pitches nose down, Right banks right,
    // Up adds vertical thrust, Yaw turns right, Pitch pitches nose up.
    UFUNCTION(BlueprintCallable, Category = "SCOUT")
    void SetFlightInput(float Forward, float Right, float Up, float Yaw, float Pitch);

    UFUNCTION(BlueprintCallable, Category = "SCOUT")
    void InitializeAssembly(const TArray<AActor*>& SourceActors);

    // Target is the pawn/collision-box center at its landing position.
    UFUNCTION(BlueprintCallable, Category = "SCOUT")
    void SetHomeLocation(const FVector& Location);

    UFUNCTION(BlueprintCallable, Category = "SCOUT")
    void RequestReturn();

    UFUNCTION(BlueprintPure, Category = "SCOUT")
    bool HasLanded() const { return bLanded; }

    UFUNCTION(BlueprintPure, Category = "SCOUT")
    int32 GetAssemblyPartCount() const { return AssemblyComponents.Num(); }

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "SCOUT")
    float Battery = 100.0f;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "SCOUT")
    FVector HomeLocation = FVector::ZeroVector;

    UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "SCOUT")
    bool bReturning = false;

    UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "SCOUT")
    TObjectPtr<UBoxComponent> CollisionRoot;

    UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "SCOUT")
    TObjectPtr<USceneComponent> VisualRoot;

    UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "SCOUT")
    TObjectPtr<USpringArmComponent> CameraArm;

    UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "SCOUT")
    TObjectPtr<UCameraComponent> Camera;

protected:
    virtual void BeginPlay() override;

private:
    void SimulateFlight(float StepSeconds);
    void MoveWithCollision(float StepSeconds);

    UPROPERTY(Transient)
    TArray<TObjectPtr<UStaticMeshComponent>> AssemblyComponents;

    FVector FlightVelocity = FVector::ZeroVector;
    FVector TranslationInput = FVector::ZeroVector;
    float YawInput = 0.0f;
    float PitchInput = 0.0f;
    float ReturnClimbSeconds = 0.0f;
    float ReturnSimSeconds = 0.0f;
    float ReturnRawSeconds = 0.0f;
    float NextReturnLogSeconds = 0.0f;
    FVector ReturnTarget = FVector::ZeroVector;
    FVector LastHitNormal = FVector::ZeroVector;
    FString LastBlockingActor = TEXT("none");
    bool bLastStartPenetrating = false;
    bool bLanded = false;
    bool bHomeSet = false;
};
