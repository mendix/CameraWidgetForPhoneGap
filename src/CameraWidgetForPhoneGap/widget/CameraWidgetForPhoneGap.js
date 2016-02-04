/*
 * Copyright 2014-2016 Mendix Technology bv
 */
require([
    "dojo/_base/declare", "mxui/widget/_WidgetBase", "dijit/_TemplatedMixin",
    "mxui/dom", "dojo/dom-class", "dojo/dom-style", "dojo/dom-construct",
    "dojo/text!CameraWidgetForPhoneGap/widget/template/CameraWidgetForPhoneGap.html"
], function(declare, _WidgetBase, _TemplatedMixin, dom, domClass, domStyle, domConstruct,
            widgetTemplate) {

    "use strict";

    return declare("CameraWidgetForPhoneGap.widget.CameraWidgetForPhoneGap", [ _WidgetBase, _TemplatedMixin ], {

        templateString: widgetTemplate,

        buttonClass: "wx-mxwx-button-extra",
        buttonText: "activate camera",
        imageContainerClass: "wx-mxwx-imagecontainer-extra",
        imageWidth: 150,
        imageHeight: 150,
        imageLocation: "Right",
        targetWidth: 150,
        targetHeight: 150,
        autoSaveEnabled: false,
        onchangemf: "",
        pictureSource: "camera",

        _contextObj: null,
        _imageUrl: null,
        _previewNode: null,


        postCreate: function() {
            this._setupWidget();
            this._createChildNodes();
        },

        update: function(obj, callback) {
            if (obj) {
                this._contextObj = obj;
                this._loadData();
                this._resetSubscriptions();
                this._setPicture("");
            }

            if (callback) callback();
        },

        _setupWidget: function() {
            domClass.add(this.domNode, "wx-CameraWidgetForPhoneGap-container");
        },

        _createChildNodes: function() {
            var elements = [ this._setupButton(), this._setupPreview() ];
            if (/below|right/i.test(this.imageLocation)) {
                elements.reverse();
            }

            var distribute = distributeHorizontally;
            if (/above|below/i.test(this.imageLocation)) {
                distribute = distributeVertically;
            }

            var tableHtml = dom.create("table", {
                "class": "wx-CameraWidgetForPhoneGap-table"
            });

            distribute(elements).forEach(function(row) {
                tableHtml.appendChild(row);
            });

            this.domNode.appendChild(tableHtml);
            this.listen("save", this._sendFile);

            function distributeVertically(elements) {
                return elements.map(function(el, i) {
                    var position = (i === 0) ? "top" :
                                   (i === elements.length - 1) ? "bottom" : "";
                    return dom.create("tr", {
                        "class": position ? "wx-CameraWidgetForPhoneGap-" + position + "-tr" : ""
                    }, dom.create("td", {
                        "class": position ? "wx-CameraWidgetForPhoneGap-" + position + "-td" : ""
                    }, el));
                });
            }

            function distributeHorizontally(elements) {
                return [ dom.create.apply(
                    dom.create,
                    [
                        "tr", { "class": "wx-CameraWidgetForPhoneGap-top-tr" }
                    ].concat(elements.map(function(el) {
                        return dom.create("td", {
                            "class": "wx-CameraWidgetForPhoneGap-top-td"
                        }, el);
                    }))
                ) ];
            }
        },

        _setupButton: function() {
            var button = dom.create("button", {
                "type": "button",
                "class": "btn btn-primary wx-CameraWidgetForPhoneGap-button " + this.buttonClass
            }, this.buttonText);

            this.connect(button, "click", "_getPicture");
            return button;
        },

        _setupPreview: function() {
            this._previewNode = dom.create("div", {
                "class": "wx-CameraWidgetForPhoneGap-preview"
            });
            return this._previewNode;
        },

        _loadData: function() {
            if (this._contextObj) {
                if (!this._contextObj.inheritsFrom("System.FileDocument")) {
                    var span = dom.create("span", {
                            "class": "alert-danger"
                        },
                        "Entity '" + this._contextObj.getEntity() + "' does not inherit from 'System.FileDocument'");
                    domConstruct.empty(this.domNode);
                    this.domNode.appendChild(span);
                }
            }

        },

        _setPicture: function(url) {
            this._imageUrl = url;
            this._setThumbnail(url);
        },

        _setThumbnail: function(url) {
            var urlDisplay = url ? "" : "none",
                width = this.imageWidth || 100,
                height = this.imageHeight || 100,
                background = url ? "url(" + url + ")" : "none";

            domStyle.set(this._previewNode, {
                "background-image": background,
                "display": urlDisplay,
                "width": width + "px",
                "height": height + "px"
            });
        },

        _getPicture: function() {
            var self = this;

            if (!navigator.camera) {
                mx.ui.error("Unable to detect camera.");
                return;
            }

            var sourceType = (this.pictureSource == "camera") ?
                    Camera.PictureSourceType.CAMERA : Camera.PictureSourceType.PHOTOLIBRARY;
            // TODO: get rid of temp image files
            navigator.camera.getPicture(success, error, {
                quality: 50,
                destinationType: Camera.DestinationType.FILE_URL,
                targetWidth: this.targetWidth,
                targetHeight: this.targetHeight,
                correctOrientation: true,
                sourceType: sourceType
            });

            function success(url) {
                if (self.autoSaveEnabled) {
                    self._autoSave(url);
                } else {
                    self._setPicture(url);
                }
            }

            function error(e) {
                if (typeof e.code !== "undefined") {
                    mx.ui.error("Retrieving image from camera failed with error code " + e.code);
                }
            }
        },

        _sendFile: function(callback) {
            var options = null,
                url = null,
                ft = null,
                self = this;

            if (!this._imageUrl) {
                callback();
                return;
            }

            options = new FileUploadOptions();
            options.fileKey = "mxdocument";
            options.fileName = this._imageUrl.substr(this._imageUrl.lastIndexOf("/") + 1);
            options.mimeType = "image/jpeg";
            options.useBrowserHttp = true;

            url = mx.appUrl +
                "file?guid=" + this._contextObj.getGuid() +
                "&csrfToken=" + mx.session.getCSRFToken();

            ft = new FileTransfer();
            ft.upload(this._imageUrl, url, success, error, options);

            function success() {
                self._setPicture("");
                self._executeMicroflow();
                callback();
            }

            function error(e) {
                mx.ui.error("Uploading image failed with error code " + e.code);
            }
        },

        _autoSave: function(url) {
            this._imageUrl = url;
            if (this._contextObj){
                 mx.data.save({
                     mxobj: this._contextObj,
                     callback: function(){
                        this._sendFile();
                     }
                }, this);
            }
        },

        _resetSubscriptions: function() {
            this.unsubscribeAll();

            if (this._contextObj) {
                this.subscribe({
                    guid: this._contextObj.getGuid(),
                    callback: function(guid) {
                        mx.data.get({
                            guid: guid,
                            callback: function(obj) {
                                this._contextObj = obj;
                                this._loadData();
                            }
                        }, this);
                    }
                });
            }
        },

        _executeMicroflow: function() {
            if (this.onchangemf && this._contextObj) {
                mx.data.action({
                    actionname: this.onchangemf,
                    applyto: "selection",
                    guids: [ this._contextObj.getGuid() ],
                    callback: function(objs) {
                        //ok
                    },
                    error: function(e) {
                        console.warn("Error running microflow: ", e);
                    }
                });
            }
        }
    });
});
