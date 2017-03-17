using System.Collections.Generic;
using EPiServer.Editor.TinyMCE;

namespace PROJECT.Web.Business.Edit.TinyMCE
{
    public class ExtendedEPiLinkConfigurationHandler : IDynamicConfigurationOptions
    {
        public IDictionary<string, object> GetConfigurationOptions()
        {
            var dictionary = new Dictionary<string, object>();
            dictionary["extendedepilinkmodel_type"] = typeof(ExtendedEPiLinkModel).FullName;
            return dictionary;
        }
    }
}