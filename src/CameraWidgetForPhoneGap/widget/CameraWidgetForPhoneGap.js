/*jslint white:true, nomen: true, plusplus: true */
/*global mx, define, require, browser, devel, console, document, Camera, FileUploadOptions, FileTransfer, navigator */
/*mendix */
/*
    CameraWidgetForPhoneGap
    ========================

	@file      : CameraWidgetForPhoneGap.js
	@version   : 2.3
	@author    : Pauline Oudeman, Richard Edens & Roeland Salij
	@date      : Friday, Jan 22, 2015
	@copyright : Mendix Technology BV
	@license   : Apache License, Version 2.0, January 2004


    Documentation
    ========================
    Describe your widget here.
*/

// Required module list. Remove unnecessary modules, you can always get them back from the boilerplate.
require([
    'dojo/_base/declare', 'mxui/widget/_WidgetBase', 'dijit/_TemplatedMixin',
    'mxui/dom', 'dojo/dom', 'dojo/query', 'dojo/dom-prop', 'dojo/dom-geometry', 'dojo/dom-class', 'dojo/dom-style', 'dojo/dom-construct', 'dojo/_base/array', 'dojo/_base/lang', 'dojo/text', 'dojo/html', 'dojo/_base/event',
    'dojo/text!CameraWidgetForPhoneGap/widget/template/CameraWidgetForPhoneGap.html'
], function (declare, _WidgetBase, _TemplatedMixin, dom, dojoDom, domQuery, domProp, domGeom, domClass, domStyle, domConstruct, dojoArray, lang, text, html, event, widgetTemplate) {
    'use strict';

    // Declare widget's prototype.
    return declare('CameraWidgetForPhoneGap.widget.CameraWidgetForPhoneGap', [_WidgetBase, _TemplatedMixin], {

        // _TemplatedMixin will create our dom node using this HTML template.
        templateString: widgetTemplate,
        // Parameters configured in the Modeler.
        buttonClass: 'wx-mxwx-button-extra',
        buttonText: 'activate camera',
        imageContainerClass: 'wx-mxwx-imagecontainer-extra',
        imageWidth: 150,
        imageHeight: 150,
        imageLocation: 'Right',
        targetWidth: 150,
        targetHeight: 150,
        autoSaveEnabled: false,
        onchangemf: '',
        pictureSource: 'camera',

        //internal variables
        _contextObj: null,
        _handles: null,
        _imageUrl: null,
        _previewNode: null,


        constructor: function () {
            this._handles = [];
        },

        postCreate: function () {
            // postCreate
            console.log('CameraWidgetForPhonegap - postCreate');
            // Setup widgets
            this._setupWidget();
            // Create childnodes
            this._createChildNodes();
        },

        update: function (obj, callback) {
            console.log('CameraWidgetForPhonegap - update');
            if (obj) {
                // Load data
                this._contextObj = obj;
                this._loadData();
                this._resetSubscriptions();
                this._setPicture('');
            } else {
                // Sorry no data no show!
                console.log('CameraWidgetForPhonegap  - update - We did not get any context object!');
            }

            if (callback) {
                callback();
            }
        },

        uninitialize: function () {
            //clean up window events here
        },

        /**
         * Building methods
         * =================
         */

        _setupWidget: function () {
            domClass.add(this.domNode, 'wx-CameraWidgetForPhoneGap-container');
        },

        _createChildNodes: function () {
            console.log('CameraWidgetForPhonegap - createChildNodes events');

            // Assigning externally loaded library to internal variable inside function.
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

            tableHtml = domConstruct.create('table', {
                'class': 'wx-CameraWidgetForPhoneGap-table'
            });

            switch (this.imageLocation) {

            case 'Above':
                trTop = domConstruct.create('tr', {
                    'class': 'wx-CameraWidgetForPhoneGap-top-tr'
                });
                tdTop = domConstruct.create('td', {
                    'class': 'wx-CameraWidgetForPhoneGap-top-td'
                });

                trBottom = domConstruct.create('tr', {
                    'class': 'wx-CameraWidgetForPhoneGap-bottom-tr'
                });
                tdBottom = domConstruct.create('td', {
                    'class': 'wx-CameraWidgetForPhoneGap-bottom-td'
                });

                tdTop.appendChild(preview);
                trTop.appendChild(tdTop);

                tdBottom.appendChild(button);
                trBottom.appendChild(tdBottom);

                tableHtml.appendChild(trTop);
                tableHtml.appendChild(trBottom);
                break;
            case 'Below':

                trTop = domConstruct.create('tr', {
                    'class': 'wx-CameraWidgetForPhoneGap-top-tr'
                });
                tdTop = domConstruct.create('td', {
                    'class': 'wx-CameraWidgetForPhoneGap-top-td'
                });

                trBottom = domConstruct.create('tr', {
                    'class': 'wx-CameraWidgetForPhoneGap-bottom-tr'
                });
                tdBottom = domConstruct.create('td', {
                    'class': 'wx-CameraWidgetForPhoneGap-bottom-td'
                });

                tdTop.appendChild(button);
                trTop.appendChild(tdTop);

                tdBottom.appendChild(preview);
                trBottom.appendChild(tdBottom);

                tableHtml.appendChild(trTop);
                tableHtml.appendChild(trBottom);

                break;
            case 'Left':
                trTable = domConstruct.create('tr', {
                    'class': 'wx-CameraWidgetForPhoneGap-top-tr'
                });
                tdLeft = domConstruct.create('td', {
                    'class': 'wx-CameraWidgetForPhoneGap-top-td'
                });
                tdRight = domConstruct.create('td', {
                    'class': 'wx-CameraWidgetForPhoneGap-top-td'
                });

                tdLeft.appendChild(preview);
                trTable.appendChild(tdLeft);

                tdRight.appendChild(button);
                trTable.appendChild(tdRight);

                tableHtml.appendChild(trTable);
                break;
            case 'Right':
                trTable = domConstruct.create('tr', {
                    'class': 'wx-CameraWidgetForPhoneGap-top-tr'
                });
                tdLeft = domConstruct.create('td', {
                    'class': 'wx-CameraWidgetForPhoneGap-top-td'
                });
                tdRight = domConstruct.create('td', {
                    'class': 'wx-CameraWidgetForPhoneGap-top-td'
                });

                tdLeft.appendChild(button);
                trTable.appendChild(tdLeft);

                tdRight.appendChild(preview);
                trTable.appendChild(tdRight);

                tableHtml.appendChild(trTable);
                break;
            default:
                trTable = domConstruct.create('tr', {
                    'class': 'wx-CameraWidgetForPhoneGap-top-tr'
                });
                tdLeft = domConstruct.create('td', {
                    'class': 'wx-CameraWidgetForPhoneGap-top-td'
                });
                tdRight = domConstruct.create('td', {
                    'class': 'wx-CameraWidgetForPhoneGap-top-td'
                });

                tdLeft.appendChild(button);
                trTable.appendChild(tdLeft);

                tdRight.appendChild(preview);
                trTable.appendChild(tdRight);

                tableHtml.appendChild(trTable);
                break;
            }

            this.domNode.appendChild(tableHtml);

            this.listen('save', this._sendFile);
        },

        _setupButton: function () {
            var button = dom.create('button', {
                'type': 'button',
                'class': 'btn btn-primary wx-CameraWidgetForPhoneGap-button ' + this.buttonClass
            }, this.buttonText);

            this.connect(button, 'click', '_getPicture');
            return button;
        },

        _setupPreview: function () {
            this._previewNode = dom.create('div', {
                'class': 'wx-CameraWidgetForPhoneGap-preview'
            });
            return this._previewNode;
        },


        /**
         * Interaction widget methods.
         * ======================
         */

        _loadData: function () {

            if (this._contextObj) {
                if (!this._contextObj.inheritsFrom("System.FileDocument")) {
                    var span = domConstruct.create('span', {
                            'class': 'alert-danger'
                        },
                        'Entity "' + this._contextObj.getEntity() + '" does not inherit from "System.FileDocument".');
                    domConstruct.empty(this.domNode);
                    this.domNode.appendChild(span);
                }
            }

        },
        _setPicture: function (url) {
            this._imageUrl = url;
            this._setThumbnail(url);
        },

        _setThumbnail: function (url) {
            var urlDisplay = url ? '' : 'none',
                width = this.imageWidth ? this.imageWidth + 'px' : '100px',
                height = this.imageHeight ? this.imageHeight + 'px' : '100px',
                background = url ? 'url(' + url + ')' : 'none';

            domStyle.set(this._previewNode, {
                'background-image': background,
                'display': urlDisplay,
                'width': width,
                'height': height
            });


        },

        _getPicture: function () {
            var success = null,
                error = null,
                self = this;

            if (!navigator.camera) {
                mx.ui.error('Unable to detect camera.');
                return;
            }

            success = function (url) {
                if (self.autoSaveEnabled) {
                    self._autoSave(url);
                } else {
                    self._setPicture(url);
                }


            };

            error = function (e) {
                if (typeof e.code !== 'undefined') {
                    mx.ui.error('Retrieving image from camera failed with error code ' + e.code);
                }
            };

            var sourceType = (this.pictureSource == 'camera') ?
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
        },

        _sendFile: function (callback) {
            var options = null,
                url = null,
                success = null,
                error = null,
                ft = null,
                self = this;

            if (!this._imageUrl) {
                callback();
                return;
            }

            options = new FileUploadOptions();
            options.fileKey = 'mxdocument';
            options.fileName = this._imageUrl.substr(this._imageUrl.lastIndexOf('/') + 1);
            options.mimeType = 'image/jpeg';

            url = mx.appUrl +
                'file?guid=' + this._contextObj.getGuid() +
                '&csrfToken=' + mx.session.getCSRFToken();

            success = function () {
                self._setPicture('');
                self._executeMicroflow();
                callback();
            };


            error = function (e) {
                mx.ui.error('Uploading image failed with error code ' + e.code);
            };

            ft = new FileTransfer();
            ft.upload(this._imageUrl, url, success, error, options);
        },

        _autoSave: function (url) {
            this._imageUrl = url;
            if(this._contextObj){
                 mx.data.save({
                    mxobj: this._contextObj,
                     callback: lang.hitch(this, function(){
                       this._sendFile();  
                     })
                });
            }
        },


        _resetSubscriptions: function () {
            var _objectHandle = null;

            // Release handles on previous object, if any.
            if (this._handles) {
                this._handles.forEach(function (handle, i) {
                    mx.data.unsubscribe(handle);
                });
                this._handles = [];
            }

            // When a mendix object exists create subscribtions. 
            if (this._contextObj) {

                _objectHandle = this.subscribe({
                    guid: this._contextObj.getGuid(),
                    callback: lang.hitch(this, function (guid) {
                        mx.data.get({
                            guid: guid,
                            callback: lang.hitch(this, function (obj) {
                                this._contextObj = obj;
                                this._loadData();
                            })
                        });
                    })
                });
                this._handles = [_objectHandle];
            }
        },

        _executeMicroflow: function () {
            if (this.onchangemf && this._contextObj) {
                mx.data.action({
                    actionname: this.onchangemf,
                    applyto: 'selection',
                    guids: [this._contextObj.getGuid()],
                    callback: function (objs) {
                        //ok
                    },
                    error: function (e) {
                        console.warn('Error running microflow: ', e);
                    }
                });
            }
        }

    });
});
