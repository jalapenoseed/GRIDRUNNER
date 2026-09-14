using UnrealBuildTool;
using System.Collections.Generic;
public class GRIDRUNNERGameTarget : TargetRules
{
    public GRIDRUNNERGameTarget(TargetInfo Target) : base(Target)
    {
        Type = TargetType.Game;
        DefaultBuildSettings = BuildSettingsVersion.Latest;
        IncludeOrderVersion = EngineIncludeOrderVersion.Latest;
        ExtraModuleNames.Add("GRIDRUNNERGame");
    }
}
