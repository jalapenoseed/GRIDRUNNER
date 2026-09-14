using UnrealBuildTool;
using System.Collections.Generic;
public class GRIDRUNNERGameEditorTarget : TargetRules
{
    public GRIDRUNNERGameEditorTarget(TargetInfo Target) : base(Target)
    {
        Type = TargetType.Editor;
        DefaultBuildSettings = BuildSettingsVersion.Latest;
        IncludeOrderVersion = EngineIncludeOrderVersion.Latest;
        ExtraModuleNames.Add("GRIDRUNNERGame");
    }
}
