(function (tinymce, $) {
    tinymce.create("tinymce.plugins.extendedepilink", {
        init: function (ed) {
            "undefined" != typeof EPi && "function" == typeof EPi.ResolveUrlFromUI && (ed.addCommand("mceExtendedEPiLink", function () {
                var href = "",
                    s = ed.selection,
                    node = s.getNode(),
                    dom = ed.dom,
                    selectedLink = dom.getParent(node, "A"),
                    linkObject = {},
                    r = s.getRng();
                if (!selectedLink) {
                    var prospect = dom.create("p", null, s.getContent());
                    1 === prospect.childNodes.length && "A" === prospect.firstChild.tagName && (selectedLink = prospect.firstChild)
                }
                if (!s.isCollapsed() || selectedLink) {
                    (href = dom.getAttrib(selectedLink, "href")), href.length && (
                        linkObject.href = href.indexOf("#") != -1 ? href.substring(0, href.indexOf("#") - 1) : href,
                        linkObject.targetName = dom.getAttrib(selectedLink, "target"),
                        linkObject.anchorOnPage = href.indexOf("#") != -1 ? href.substring(href.indexOf("#") + 1) : "",
                        linkObject.title = dom.getAttrib(selectedLink, "title"));

                    var allAnchors = Array(),
                        allLinks = $("a", ed.getDoc());
                    allAnchors.push({
                        text: "",
                        value: ""
                    }), allLinks.each(function () {
                        $(this).attr("name") !== void 0 && $(this).attr("name").length > 0 && ($(this).attr("href") === void 0 || 0 === $(this).attr("href").length) && allAnchors.push({
                            text: $(this).attr("name"),
                            value: "#" + $(this).attr("name")
                        });
                    });
                    var anchors = allAnchors.sort(function (a, b) {
                        return a.text.toLowerCase() > b.text.toLowerCase() ? 1 : -1;
                    }),
                        callbackMethod = function (value) {
                            var html, isUpdated, elementArray;
                            if (value && value.href) {
                                if ("-1" == value && selectedLink) html = selectedLink.innerHTML, dom.setOuterHTML(selectedLink, html), ed.undoManager.add();
                                else if (0 !== value) {
                                    isUpdated = value.isUpdated;
                                    var linkAttributes = {
                                        href: value.anchorOnPage != null && value.anchorOnPage != '' ?
                                            value.href + '#' + value.anchorOnPage : value.href,
                                        title: value.title,
                                        target: value.target ? value.target : null
                                    };
                                    if (selectedLink) s.select(selectedLink), dom.setAttribs(selectedLink, linkAttributes), ed.undoManager.add();
                                    else {
                                        for (s.setRng(r), ed.getDoc().execCommand("unlink", !1, null), ed.execCommand("mceInsertLink", !1, "#mce_ext_temp_url#", {
                                            skip_undo: 1
                                        }), elementArray = tinymce.grep(dom.select("a"), function (n) {
                                            return "#mce_ext_temp_url#" == dom.getAttrib(n, "href")
                                        }), i = 0; elementArray.length > i; i++) dom.setAttribs(elementArray[i], linkAttributes);
                                        if (elementArray.length > 0) {
                                            var range = ed.dom.createRng();
                                            range.selectNodeContents(elementArray[0]), ed.selection.setRng(range);
                                        }
                                        ed.undoManager.add();
                                    }
                                }
                            } else selectedLink && (html = selectedLink.innerHTML, dom.setOuterHTML(selectedLink, html), ed.undoManager.add());
                            ed.windowManager.onClose.dispatch();
                        };
                    require([
                            "dojo/_base/lang",
                            "dojo/_base/array",
                            "dojo/on",
                            "dojo/when",
                            "dojo/dom-style",
                            "dojo/_base/connect",
                            "epi/dependency",
                            "epi/shell/widget/dialog/Dialog",
                            "epi-cms/ApplicationSettings",
                            "epi-cms/widget/LinkEditor",
                            "epi/i18n!epi/cms/nls/episerver.cms.widget.editlink"
                    ],
                        function (lang, array, on, when, domStyle, connect, dependency, Dialog, ApplicationSettings, LinkEditor, resource) {
                            var registry = dependency.resolve("epi.storeregistry");
                            store = registry.get("epi.cms.content.light");
                            var frames = ApplicationSettings.frames,
                                findFrameName = function (frames, frameId) {
                                    var filteredFrames = array.filter(frames, function (frame) {
                                        return frame.id == frameId;
                                    });
                                    return filteredFrames && filteredFrames.length > 0 ? filteredFrames[0].name : "";
                                },
                                findFrameId = function (frames, frameName) {
                                    var filteredIds = array.filter(frames, function (frame) {
                                        return frame.name == frameName;
                                    });
                                    return filteredIds && filteredIds.length > 0 ? filteredIds[0].id : "";
                                };
                            linkObject.target = findFrameId(frames, linkObject.targetName);
                            var linkEditor = new LinkEditor({
                                modelType: ed.getParam("extendedepilinkmodel_type"),
                                hiddenFields: ["text"]
                            }),
                            getAnchorWidget = function (widgetList) {
                                return array.filter(widgetList, function (wrapper) {
                                    return "Anchor" == wrapper.name;
                                });
                            },
                            getPageWidget = function (widgetList) {
                                return array.filter(widgetList, function (wrapper) {
                                    return "Page" == wrapper.name || "Sida" == wrapper.name;
                                });
                            };

                            var anchorOnPageWidget = null;
                            linkEditor.on("fieldCreated", function (fieldname, widget) {
                                if ("href" === fieldname) {
                                    var hyperLinkSelector = widget,
                                        anchor = null,
                                        anchorWidget = getAnchorWidget(hyperLinkSelector.wrappers);
                                    anchorWidget && anchorWidget.length > 0 && (anchor = anchorWidget[0]), anchor && anchor.inputWidget ? anchor.inputWidget.set("selections", anchors) : widget.on("selectorsCreated", function (hyperLinkSelector) {
                                        var anchorWidget = getAnchorWidget(hyperLinkSelector.wrappers);
                                        anchorWidget && anchorWidget.length > 0 && anchorWidget[0].inputWidget && anchorWidget[0].inputWidget.set("selections", anchors)
                                    }), anchor && domStyle.set(anchor.domNode, {
                                        display: "block"
                                    });

                                    var pageWidget = getPageWidget(hyperLinkSelector.wrappers);
                                    if (pageWidget && pageWidget.length > 0) {
                                        var inputWidget = pageWidget[0].inputWidget;

                                        dojo.connect(inputWidget, "onChange", dojo.partial(pageSelected, anchorOnPageWidget));
                                    }
                                }
                                else if ("anchorOnPage" === fieldname) {
                                    anchorOnPageWidget = widget;
                                }
                            });

                            function pageSelected(anchorOnPageWidget, pageIdMightBeWithVersion) {

                                if (!pageIdMightBeWithVersion || pageIdMightBeWithVersion.length == 0) {
                                    var emptyAnchorsOnPage = Array();
                                    emptyAnchorsOnPage.push({
                                        text: "",
                                        value: ""
                                    });
                                    populateAnchorOnPageDropdown(emptyAnchorsOnPage);
                                } else {
                                    var anchorApiUrl = '/api/tiny/anchors/frompageid/' + pageIdMightBeWithVersion;

                                    require(['dojo/_base/xhr'], function (xhr) {
                                        xhr.get({
                                            url: anchorApiUrl,
                                            handleAs: "json",
                                            load: function (data) {
                                                if (!data || data.length == 0) {
                                                    return;
                                                }
                                                var allAnchorsOnPage = Array();
                                                allAnchorsOnPage.push({
                                                    text: "",
                                                    value: ""
                                                });
                                                for (var i = 0; i < data.length; i++) {
                                                    allAnchorsOnPage.push({
                                                        text: data[i].Heading,
                                                        value: data[i].Anchor
                                                    });
                                                }
                                                populateAnchorOnPageDropdown(allAnchorsOnPage);
                                            },
                                            error: function (data) {
                                                console.log("Getting data from " + anchorApiUrl + " failed.");
                                            }
                                        });
                                    });
                                }
                            }

                            function populateAnchorOnPageDropdown(allAnchorsOnPage) {
                                anchorOnPageWidget.set("selections", allAnchorsOnPage);
                                if (linkObject.anchorOnPage != null && linkObject.anchorOnPage.length > 0) {
                                    anchorOnPageWidget.set("value", linkObject.anchorOnPage);
                                }
                                domStyle.set(anchorOnPageWidget.domNode, {
                                    display: "block"
                                });
                            }

                            var dialogTitle = lang.replace(selectedLink ? resource.title.template.edit : resource.title.template.create, resource.title.action);
                            dialog = new Dialog({
                                title: dialogTitle,
                                dialogClass: "epi-dialog-portrait",
                                content: linkEditor,
                                destroyOnHide: !0,
                                defaultActionsVisible: !1
                            }), dialog.startup(),
                                linkEditor.set("value", linkObject),
                                dialog.show(),
                                ed.windowManager.onOpen.dispatch(),
                                on(dialog, "execute", function () {
                                    var value = linkEditor.get("value");
                                    value && value.target &&
                                        (value.target = findFrameName(frames, value.target)),
                                        linkEditor.destroy(),
                                        linkEditor = null, callbackMethod(value);
                                });
                        }
                    );
                }
            }), ed.addButton("extendedepilink", {
                title: "epilink.desc",
                cmd: "mceExtendedEPiLink",
                "class": "mce_extendedepilink"
            }), ed.addShortcut("ctrl+m", "epilink.desc", "mceExtendedEPiLink"), ed.onNodeChange.add(function (ed, cm, n, co) {
                var a = ed.dom.getParent(n, "a", ed.getBody()) || ("A" === n.tagName ? n : null);
                a && a.innerHTML === ed.selection.getContent() && ed.selection.select(a), cm.setDisabled("extendedepilink", co && null === a), cm.setActive("extendedepilink", null !== a && !a.name);
            }));
        },
        getInfo: function () {
            return {
                longname: "Extended link plugin",
                author: "Mogul",
                authorurl: "http://www.mogul.com",
                infourl: "http://www.mogul.com",
                version: "1.0"
            };
        }
    }), tinymce.PluginManager.add("extendedepilink", tinymce.plugins.extendedepilink);
})(tinymce, epiJQuery);