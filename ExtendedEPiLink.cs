using EPiServer.Editor.TinyMCE;

namespace PROJECT.Web.Business.Edit.TinyMCE
{
    [TinyMCEPluginButton(
        ButtonName = "extendedepilink", 
        ButtonSortIndex = 1, 
        DynamicConfigurationOptionsHandler = typeof(ExtendedEPiLinkConfigurationHandler), 
        GroupName = "media",
        IconUrl = "/ClientResources/Images/icons/extended-link-icon.gif",
        LanguagePath = "/admin/tinymce/plugins/epilink/epilink",
        PlugInName = "extendedepilink")]
    public class ExtendedEPiLink
    {
    }
}