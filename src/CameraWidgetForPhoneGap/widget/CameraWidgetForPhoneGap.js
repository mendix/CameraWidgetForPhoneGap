/*jslint white:true, nomen: true, plusplus: true */
/*global mx, define, require, browser, devel, console, document, Camera, FileUploadOptions, FileTransfer, navigator */
/*mendix */
/*
    CameraWidgetForPhoneGap
    ========================

	@file      : CameraWidgetForPhoneGap.js
	@version   : 2.5
	@copyright : Mendix Technology BV
	@license   : Apache License, Version 2.0, January 2004


    Documentation
    ========================
    Describe your widget here.
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
        _handles: null,
        _imageUrl: null,
        _previewNode: null,


        constructor: function() {
            this._handles = [];
        },

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
            var button = null,
                preview = null,
                tableHtml = null,
                trTop = null,
                trBottom = null,
                tdTop = null,
                tdBottom = null,
                trTable = null,
                tdLeft = null,
                tdRight = null;

            button = this._setupButton();
            preview = this._setupPreview();

            tableHtml = dom.create("table", {
                "class": "wx-CameraWidgetForPhoneGap-table"
            });

            switch (this.imageLocation) {
            case "Above":
                trTop = dom.create("tr", {
                    "class": "wx-CameraWidgetForPhoneGap-top-tr"
                });
                tdTop = dom.create("td", {
                    "class": "wx-CameraWidgetForPhoneGap-top-td"
                });

                trBottom = dom.create("tr", {
                    "class": "wx-CameraWidgetForPhoneGap-bottom-tr"
                });
                tdBottom = dom.create("td", {
                    "class": "wx-CameraWidgetForPhoneGap-bottom-td"
                });

                tdTop.appendChild(preview);
                trTop.appendChild(tdTop);

                tdBottom.appendChild(button);
                trBottom.appendChild(tdBottom);

                tableHtml.appendChild(trTop);
                tableHtml.appendChild(trBottom);
                break;
            case "Below":
                trTop = dom.create("tr", {
                    "class": "wx-CameraWidgetForPhoneGap-top-tr"
                });
                tdTop = dom.create("td", {
                    "class": "wx-CameraWidgetForPhoneGap-top-td"
                });

                trBottom = dom.create("tr", {
                    "class": "wx-CameraWidgetForPhoneGap-bottom-tr"
                });
                tdBottom = dom.create("td", {
                    "class": "wx-CameraWidgetForPhoneGap-bottom-td"
                });

                tdTop.appendChild(button);
                trTop.appendChild(tdTop);

                tdBottom.appendChild(preview);
                trBottom.appendChild(tdBottom);

                tableHtml.appendChild(trTop);
                tableHtml.appendChild(trBottom);
                break;
            case "Left":
                trTable = dom.create("tr", {
                    "class": "wx-CameraWidgetForPhoneGap-top-tr"
                });
                tdLeft = dom.create("td", {
                    "class": "wx-CameraWidgetForPhoneGap-top-td"
                });
                tdRight = dom.create("td", {
                    "class": "wx-CameraWidgetForPhoneGap-top-td"
                });

                tdLeft.appendChild(preview);
                trTable.appendChild(tdLeft);

                tdRight.appendChild(button);
                trTable.appendChild(tdRight);

                tableHtml.appendChild(trTable);
                break;
            case "Right":
                trTable = dom.create("tr", {
                    "class": "wx-CameraWidgetForPhoneGap-top-tr"
                });
                tdLeft = dom.create("td", {
                    "class": "wx-CameraWidgetForPhoneGap-top-td"
                });
                tdRight = dom.create("td", {
                    "class": "wx-CameraWidgetForPhoneGap-top-td"
                });

                tdLeft.appendChild(button);
                trTable.appendChild(tdLeft);

                tdRight.appendChild(preview);
                trTable.appendChild(tdRight);

                tableHtml.appendChild(trTable);
                break;
            default:
                trTable = dom.create("tr", {
                    "class": "wx-CameraWidgetForPhoneGap-top-tr"
                });
                tdLeft = dom.create("td", {
                    "class": "wx-CameraWidgetForPhoneGap-top-td"
                });
                tdRight = dom.create("td", {
                    "class": "wx-CameraWidgetForPhoneGap-top-td"
                });

                tdLeft.appendChild(button);
                trTable.appendChild(tdLeft);

                tdRight.appendChild(preview);
                trTable.appendChild(tdRight);

                tableHtml.appendChild(trTable);
                break;
            }

            this.domNode.appendChild(tableHtml);
            this.listen("save", this._sendFile);
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
