#pragma once

#include "CoreMinimal.h"
#include "WheeledVehiclePawn.h"
#include "GRBikePawn.generated.h"

class UAnimationAsset;
class UCameraComponent;
class USkeletalMesh;
class USkeletalMeshComponent;
class USpringArmComponent;
class UChaosWheeledVehicleMovementComponent;

/** GRIDRUNNER's single-speed electric drivetrain, using the imported bike's Chaos wheels. */
UCLASS(Blueprintable)
class GRIDRUNNERGAME_API AGRBikePawn : public AWheeledVehiclePawn
{
    GENERATED_BODY()

public:
    AGRBikePawn(const FObjectInitializer& ObjectInitializer);

    virtual void BeginPlay() override;
    virtual void Tick(float DeltaSeconds) override;
    virtual void PossessedBy(AController* NewController) override;
    virtual void UnPossessed() override;

    /** Copy the vendor's rig/physics/wheels without running its gameplay or combustion audio. */
    UFUNCTION(BlueprintCallable, Category="GRIDRUNNER|Bike")
    bool SetupFromTemplate(UClass* VendorClass);

    /** Throttle: -1 reverse to +1 forward. Direction changes brake to a stop first. */
    UFUNCTION(BlueprintCallable, Category="GRIDRUNNER|Bike")
    void SetDriveInput(float Throttle, float Steering, float Brake);

    UFUNCTION(BlueprintPure, Category="GRIDRUNNER|Bike")
    float SpeedKmh() const;

    UFUNCTION(BlueprintPure, Category="GRIDRUNNER|Bike")
    bool IsDriveReady() const { return bDriveReady; }

    UFUNCTION(BlueprintCallable, Category="GRIDRUNNER|Bike")
    void SetRiderVisible(bool bVisible);

    UFUNCTION(BlueprintCallable, Category="GRIDRUNNER|Bike")
    void AddBattery(float Percentage);

    UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category="GRIDRUNNER|Bike")
    TObjectPtr<USpringArmComponent> CameraBoom;

    UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category="GRIDRUNNER|Bike")
    TObjectPtr<UCameraComponent> FollowCamera;

    UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category="GRIDRUNNER|Bike")
    TObjectPtr<USkeletalMeshComponent> Rider;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="GRIDRUNNER|Bike|Assets")
    TSoftClassPtr<AWheeledVehiclePawn> VendorTemplateClass;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="GRIDRUNNER|Bike|Assets")
    TSoftObjectPtr<USkeletalMesh> RiderMeshAsset;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="GRIDRUNNER|Bike|Assets")
    TSoftObjectPtr<UAnimationAsset> RiderIdleAnimation;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="GRIDRUNNER|Bike|Assets")
    FTransform RiderTransform = FTransform(FRotator(0.f, -90.f, 0.f));

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="GRIDRUNNER|Bike|Energy", meta=(ClampMin="0", ClampMax="100"))
    float Battery = 100.f;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="GRIDRUNNER|Bike|Energy", meta=(ClampMin="0.1"))
    float BatteryCapacityKWh = 3.f;

    UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category="GRIDRUNNER|Bike|Energy")
    float MotorPowerKW = 0.f;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="GRIDRUNNER|Bike|Drive", meta=(ClampMin="1"))
    float MaxMotorTorqueNm = 48.f;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="GRIDRUNNER|Bike|Drive", meta=(ClampMin="5"))
    float MaxSpeedKmh = 72.f;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="GRIDRUNNER|Bike|Drive", meta=(ClampMin="1"))
    float MaxReverseSpeedKmh = 8.f;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="GRIDRUNNER|Bike|Drive", meta=(ClampMin="50"))
    float VehicleMassKg = 190.f;

    /** Physical roll correction; leaves pitch, suspension, collisions and airborne motion intact. */
    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="GRIDRUNNER|Bike|Balance", meta=(ClampMin="0"))
    float BalanceStrength = 70.f;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="GRIDRUNNER|Bike|Balance", meta=(ClampMin="0"))
    float BalanceDamping = 12.f;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="GRIDRUNNER|Bike|Balance", meta=(ClampMin="0", ClampMax="35"))
    float MaxLeanDegrees = 18.f;

private:
    UChaosWheeledVehicleMovementComponent* BikeMovement() const;
    void ConfigureElectricDrive();
    bool HasWheelContact() const;
    void UpdateBalance(float DeltaSeconds);
    void UpdateDriveAndEnergy(float DeltaSeconds);

    bool bDriveReady = false;
    float RequestedThrottle = 0.f;
    float RequestedSteering = 0.f;
    float RequestedBrake = 0.f;
    float PreviousSpeedCm = 0.f;
    float SmoothedLean = 0.f;
    float DiagnosticAge = 0.f;
    float NextDiagnosticTime = 0.f;
    bool bDiagnostics = false;
};
