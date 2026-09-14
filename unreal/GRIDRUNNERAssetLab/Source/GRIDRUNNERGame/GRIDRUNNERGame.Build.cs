using UnrealBuildTool;
public class GRIDRUNNERGame : ModuleRules
{
    public GRIDRUNNERGame(ReadOnlyTargetRules Target) : base(Target)
    {
        PCHUsage = PCHUsageMode.UseExplicitOrSharedPCHs;
        PublicDependencyModuleNames.AddRange(new string[] {
            "Core", "CoreUObject", "Engine", "InputCore", "EnhancedInput",
            "ChaosVehicles", "PhysicsCore", "Niagara", "Json", "JsonUtilities"
        });
    }
}
