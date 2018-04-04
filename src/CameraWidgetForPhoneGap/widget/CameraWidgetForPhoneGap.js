/*
 * Copyright 2014-2016 Mendix Technology bv
 */
require([
    "dojo/_base/declare", "mxui/widget/_WidgetBase", "dijit/_TemplatedMixin",
    "mxui/dom", "dojo/dom-class", "dojo/dom-style", "dojo/dom-construct"
], function(declare, _WidgetBase, _TemplatedMixin, dom, domClass, domStyle, domConstruct) {

    "use strict";

    return declare("CameraWidgetForPhoneGap.widget.CameraWidgetForPhoneGap", [ _WidgetBase ], {

        buttonClass: "wx-mxwx-button-extra",
        buttonText: "activate camera",
        imageContainerClass: "wx-mxwx-imagecontainer-extra",
        imageWidth: 150,
        imageHeight: 150,
        imageLocation: "right",
        targetWidth: 150,
        targetHeight: 150,
        autoSaveEnabled: false,
        onchangemf: "",
        onSaveNanoflow: "",
        pictureSource: "camera",

        _contextObj: null,
        _imageUrl: null,
        _previewNode: null,


        postCreate: function() {
            domClass.add(this.domNode, "wx-CameraWidgetForPhoneGap");

            var elements = [ this._setupPreview(), this._setupButton() ];
            if (/below|right/.test(this.imageLocation)) {
                elements.reverse();
            }

            var alignment = "horizontal";
            if (/above|below/.test(this.imageLocation)) {
                alignment = "vertical";
            }

            elements.forEach(function(el) {
                domClass.add(el, "wx-CameraWidgetForPhoneGap-" + alignment);
                this.domNode.appendChild(el);
            }, this);

            this.listen("commit", this._sendFile);
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
                "class": "wx-CameraWidgetForPhoneGap-preview " + this.imageContainerClass
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
                window.mx.ui.error("Unable to detect camera.");
                return;
            }

            var sourceType = (this.pictureSource == "camera") ?
                    Camera.PictureSourceType.CAMERA : Camera.PictureSourceType.PHOTOLIBRARY;
            var params = {
                quality: 50,
                destinationType: Camera.DestinationType.FILE_URL,
                correctOrientation: true,
                sourceType: sourceType
            };
            if (this.targetWidth !== 0) params.targetWidth = this.targetWidth;
            if (this.targetHeight !== 0) params.targetHeight = this.targetHeight;
            // TODO: get rid of temp image files
            navigator.camera.getPicture(success, error, params);

            function success(url) {
                if (self.autoSaveEnabled) {
                    self._autoSave(url);
                } else {
                    self._setPicture(url);
                }
            }

            function error(e) {
                if (typeof e.code !== "undefined") {
                    window.mx.ui.error("Retrieving image from camera failed with error code " + e.code);
                }
            }
        },

        _sendFile: function(callback) {
            var self = this;

            if (!this._imageUrl) {
                if (callback) callback();
                return;
            }

            var filename = /[^\/]*$/.exec(this._imageUrl)[0];
            var guid = this._contextObj.getGuid();
            if (window.mx.data.saveDocument && window.mx.data.saveDocument.length === 6) {
                window.resolveLocalFileSystemURL(this._imageUrl, function(fileEntry) {
                    fileEntry.file(function(blob) {
                        var fileReader = new FileReader();
                        fileReader.onload = function(e) {
                            window.mx.data.saveDocument(guid, filename, {}, new Blob([ e.target.result ]), success, error);
                        };

                        fileReader.onerror = function(e) {
                            error(e.target.error);
                        };

                        fileReader.readAsArrayBuffer(blob);
                    }, error);
                }, error);
            } else {
                // For Mendix versions < 6.4
                var options = new FileUploadOptions();
                options.fileKey = "mxdocument";
                options.fileName = filename;
                options.mimeType = "image/jpeg";
                options.useBrowserHttp = true;

                var url = mx.appUrl +
                    "file?guid=" + this._contextObj.getGuid() +
                    "&csrfToken=" + mx.session.getCSRFToken();

                var ft = new FileTransfer();
                ft.upload(this._imageUrl, url, refreshObject, error, options);
            }

            function refreshObject() {
                window.mx.data.get({
                    guid: guid,
                    noCache: true,
                    callback: success,
                    error: error
                });
            }

            function success() {
                self._setPicture("");
                self._executeAction();
                if (callback) callback();
            }

            function error(e) {
                window.mx.ui.error("Uploading image failed with error code " + e.code);
            }
        },

        _autoSave: function(url) {
            this._imageUrl = url;
            if (this._contextObj){
                 window.mx.data.commit({
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
                        window.mx.data.get({
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

        _executeAction: function() {
            if (this.onchangemf && this._contextObj) {
                window.mx.data.action({
                    params: {
                        actionname: this.onchangemf,
                        applyto: "selection",
                        guids: [ this._contextObj.getGuid() ]
                    },
                    callback: function(objs) {
                        //ok
                    },
                    error: function(e) {
                        console.warn("Error running microflow: ", e);
                    }
                });
            }

            if (this.onSaveNanoflow && this.mxcontext) {
                mx.data.callNanoflow({
                    nanoflow: this.onSaveNanoflow,
                    origin: this.mxform,
                    context: this.mxcontext,
                    error: function (error) {
                        mx.ui.error(error.message);
                    }
                });
            }
        },
    });
});
