using System.Collections.Generic;
using System.Text;
using EPiServer;
using EPiServer.Core;
using Mogul.Web.Framework.EPi.Extensions;

namespace PROJECT.Web.Services
{
    public interface IAnchorService
    {
        List<AnchorHeadingPair> GetOrSetFromPageIdForTinyMce(string pageIdWithVersion); 
        string GetAnchorString(string s, int contentId);
    }

    public class AnchorService : IAnchorService
    {
        private readonly IContentLoader _contentLoader;

        public AnchorService(IContentLoader contentLoader)
        {
            _contentLoader = contentLoader;
        }

        public List<AnchorHeadingPair> GetOrSetFromPageIdForTinyMce(string pageIdWithVersion)
        {
            if (string.IsNullOrEmpty(pageIdWithVersion)) return null;

            var pageIdWithoutVersion = pageIdWithVersion;
            var pageId = 0;
            var indexOfUnderscore = pageIdWithVersion.IndexOf('_');
            if (indexOfUnderscore > 0)
            {
                pageIdWithoutVersion = pageIdWithVersion.Substring(0, indexOfUnderscore);
            }

            int.TryParse(pageIdWithoutVersion, out pageId);

            var anchorContent = _contentLoader.Get<IContent>(new ContentReference(pageId));
            return GetAnchorHeadingPairs(anchorContent);
        }

        private List<AnchorHeadingPair> GetAnchorHeadingPairs(IContent anchorContentContainer)
        {
            var anchorHeadingPairList = new List<AnchorHeadingPair>();

            if (anchorContentContainer != null)
            {
                var headingContainer = anchorContentContainer as IHeading;
                if (headingContainer != null)
                {
                    var heading = headingContainer.Heading;
                    var anchorLink = GetAnchorString(heading, anchorContentContainer.ContentLink.ID);
                    if (anchorLink != null)
                    {
                        var topHeadingAnchor = new AnchorHeadingPair
                        {
                            Heading = heading,
                            Anchor = anchorLink,
                        };
                        anchorHeadingPairList.Add(topHeadingAnchor);
                    }
                }

                if (anchorContentContainer is IHasContentArea &&
                   (anchorContentContainer as IHasContentArea).Content.AnyBlocks())
                {
                    foreach (var contentAreaItem in (anchorContentContainer as IHasContentArea).Content.Items)
                    {
                        var block = _contentLoader.Get<IContent>(contentAreaItem.ContentLink);

                        if (block != null)
                        {
                            var anchorsFromContentArea = GetAnchorHeadingPairs(block);
                            anchorHeadingPairList.AddRange(anchorsFromContentArea);
                        }
                    }
                }
            }

            return anchorHeadingPairList;
        }

        private static readonly Dictionary<char, char> SwedishReplacingChars = new Dictionary<char, char>
        {
           {'Å', 'A'}, {'Ä', 'A'}, {'Ö', 'O'}, {'å', 'a'}, {'ä', 'a'}, {'ö', 'o'}
        };

        public string GetAnchorString(string s, int contentId)
        {
            if (string.IsNullOrEmpty(s)) return null;
            var prevChar = char.MinValue;
            var alphaNumericString = new StringBuilder();
            foreach (var c in s)
            {
                var newChar = char.IsLetterOrDigit(c) ? char.ToLower(c) : '_';
                if (newChar != '_' || newChar != prevChar)
                {
                    if (SwedishReplacingChars.ContainsKey(newChar))
                    {
                        alphaNumericString.Append(SwedishReplacingChars[newChar]);
                    }
                    else
                    {
                        alphaNumericString.Append(newChar);
                        prevChar = newChar;
                    }
                }
            }
            alphaNumericString.Append('_');
            alphaNumericString.Append(contentId);

            return alphaNumericString.ToString();
        }
    }

    public class AnchorHeadingPair
    {
        public string Anchor { get; set; }
        public string Heading { get; set; }
    }

    public interface IHeading
    {
        string Heading { get; }
    }

    public interface IHasContentArea
    {
        ContentArea Content { get; }
    }
}