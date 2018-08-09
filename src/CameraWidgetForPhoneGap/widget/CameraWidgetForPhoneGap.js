/*
 * Copyright 2014-2016 Mendix Technology bv
 */
require([
    "dojo/_base/declare", "mxui/widget/_WidgetBase", "dijit/_TemplatedMixin",
    "mxui/dom", "dojo/dom-class", "dojo/dom-style", "dojo/dom-construct", "mendix/lang"
], function(declare, _WidgetBase, _TemplatedMixin, dom, domClass, domStyle, domConstruct, mxLang) {

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
        blockingUpload: "disabled", // disabled, duringUpload, onFormSave
        progressText: "Uploading image in progress...",

        _contextObj: null,
        _imageUrl: null,
        _previewNode: null,

        progressId: undefined,
        uploading: false,
        uploadError: false,

        postCreate: function() {
            this._updateRendering();
            this._setupFromEvent();
        },

        update: function(obj, callback) {
            if (obj) {
                this._contextObj = obj;
                this._validateContext(obj);
            }
            this._setPicture("");

            if (callback) {
                callback();
            }
        },

        _updateRendering: function() {
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

        _setupFromEvent: function() {
            this.listen("commit", function(callback) {
                if (!this.autoSaveEnabled) {
                    this.uploading = true;
                    this._sendFile(callback);
                } else {
                    if (this.uploading && this.blockingUpload === "onFormSave") {
                        this._showProgress();
                        var self = this;
                        mxLang.delay(function() {
                            if (!self.uploadError) {
                                callback();
                            }
                        }, function() { return !self.uploading; }, 100);
                    } else {
                        callback();
                    }
                }
            });
        },

        _validateContext: function(contextObject) {
            if (contextObject && !contextObject.inheritsFrom("System.FileDocument")) {
                var span = dom.create("span", {
                    "class": "alert-danger",
                    innerHTML: 'Entity "' + contextObject.getEntity() + '" does not inherit from "System.FileDocument".'
                });
                domConstruct.empty(this.domNode);
                this.domNode.appendChild(span);
            }
        },

        _setPicture: function(url) {
            this._imageUrl = url;
            this._setThumbnail(url);
        },

        _setThumbnail: function(url) {
            var urlDisplay = url ? "" : "none";
            var width = this.imageWidth || 100;
            var height = this.imageHeight || 100;
            var background = url ? "url(" + url + ")" : "none";

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

            var options = this._getOptions();
            navigator.camera.getPicture(success, error, options);

            function success(url) {
                if (self.autoSaveEnabled) {
                    self._autoSave(url);
                } else {
                    self._setPicture(url);
                }
            }

            function error(error) {
                var message = error ? error.trim().toLowerCase() : "unknown";
                const cameraError = "no image selected."
                const cameraError2 = "camera cancelled."
                if (message.indexOf(cameraError) > -1 && message.indexOf(cameraError2) > -1) {
                    window.mx.ui.error("Error while retrieving image with error " + error);
                    logger.error(self.friendlyId + " : error while retrieving image", error);
                } else {
                    logger.warn(self.friendlyId + " : error while retrieving image", error);
                }
            }
        },

        _getOptions() {
            var sourceType = this.pictureSource == "camera"
                ? Camera.PictureSourceType.CAMERA
                : Camera.PictureSourceType.PHOTOLIBRARY;

            var options = {
                quality: 100,
                destinationType: Camera.DestinationType.FILE_URL,
                correctOrientation: true,
                sourceType: sourceType,
                targetWidth: this.targetWidth !== 0 ? this.targetWidth : undefined,
                targetHeight: this.targetHeight !== 0 ? this.targetHeight : undefined
            };

            return options;
        },

        _sendFile: function(callback) {
            logger.debug(this.friendlyId + "._sendFile");
            this.uploadError = false;
            var self = this;

            if (!this._imageUrl) {
                self._hideProgress();
                if (callback) {
                    callback();
                }
                return;
            }
            if (this.blockingUpload === "duringUpload") {
                this._showProgress();
            }

            var filename = /[^\/]*$/.exec(this._imageUrl)[0];
            var guid = this._contextObj.getGuid();

            window.resolveLocalFileSystemURL(this._imageUrl, function(fileEntry) {
                fileEntry.file(function(blob) {
                    var fileReader = new FileReader();
                    fileReader.onload = function(event) {
                        window.mx.data.saveDocument(guid, filename, {}, new Blob([ event.target.result ]), success, error);
                    };

                    fileReader.onerror = function(event) {
                        this.uploadError = true;
                        error(event.target.error);
                    };

                    fileReader.readAsArrayBuffer(blob);
                }, error);
            }, error);

            function success() {
                self._executeAction(function() {
                    self._setPicture("");
                    self._hideProgress();
                    logger.debug(self.id + ".upload done");
                    if (callback) {
                        callback();
                    }
                });
            }

            function error(e) {
                this.uploadError = true;
                self._hideProgress();
                logger.error(this.friendlyId + "Uploading image failed with error", e);
                window.mx.ui.error("Uploading image failed with error " + e.message || e.code || "");
            }
        },

        _autoSave: function(url) {
            logger.debug(this.friendlyId + "._autoSave");
            this._imageUrl = url;
            if (this._contextObj){
                this.uploading = true;
                if (this.blockingUpload === "duringUpload") {
                    this._showProgress();
                }
                window.mx.data.commit({
                    mxobj: this._contextObj,
                    callback: function(){
                        this._sendFile();
                    },
                    error: function(error) {
                        this.uploadError = true;
                        this._hideProgress();
                        logger.error(this.friendlyId + " Error committing image ", error);
                        window.mx.ui.error("Error saving image " + error.message);
                    }
                }, this);
            }
        },

        _showProgress: function() {
            if (!this.progressId) {
                this.progressId = mx.ui.showProgress(this.progressText, true);
            }
        },

        _hideProgress: function() {
            this.uploading = false;
            if (this.progressId) {
                mx.ui.hideProgress(this.progressId);
                this.progressId = undefined;
            }
        },

        _executeAction: function(callback) {
            if (this.onchangemf && this.mxcontext) {
                window.mx.ui.action(this.onchangemf, {
                    params: {
                        applyto: "selection",
                        guids: [ this.mxcontext.getTrackId() ]
                    },
                    origin: this.mxform,
                    callback: callback,
                    error: function(error) {
                        this.uploadError = true;
                        mx.ui.error("An error occurred while executing on save microflow " + this.onchangemf + " : " + error.message);
                        callback();
                    }
                }, this);
            }

            if (this.onSaveNanoflow.nanoflow && this.mxcontext) {
                window.mx.data.callNanoflow({
                    nanoflow: this.onSaveNanoflow,
                    origin: this.mxform,
                    context: this.mxcontext,
                    callback: callback,
                    error: function (error) {
                        this.uploadError = true;
                        mx.ui.error("An error occurred while executing the on save nanoflow: " + error.message);
                        logger.error(this.friendlyId + " An error occurred while executing the on save nanoflow", error);
                        callback();
                    }
                }, this);
            }

            if (!this.onchangemf && !this.onSaveNanoflow.nanoflow || !this.mxcontext) {
                callback();
            }
        },
    });
});
