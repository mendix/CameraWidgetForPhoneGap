/*jslint white: true nomen: true plusplus: true */
/*global mx, mxui, mendix, dojo, require, console, define, module, Camera, FileUploadOptions, FileTransfer */
/*mendix

	CameraWidgetForPhonegap
	========================

	@file      : CameraWidgetForPhoneGap.js
	@version   : 1.0
	@author    : Roeland Salij & Richard Edens
	@date      : Friday, December 12, 2014
	@copyright : Mendix Technology BV
	@license   : Apache License, Version 2.0, January 2004

	Documentation
    ========================
	Describe your widget here.

*/

(function() {
    'use strict';

    // test
    require([

        'mxui/widget/_WidgetBase', 'dijit/_Widget', 'dijit/_TemplatedMixin',
        'mxui/dom', 'dojo/dom-construct', 'dojo/dom', 'dojo/query', 'dojo/dom-prop', 'dojo/dom-geometry', 'dojo/dom-class', 'dojo/dom-style', 'dojo/on', 'dojo/_base/lang', 'dojo/_base/declare', 'dojo/text'

    ], function (_WidgetBase, _Widget, _Templated, domConstruct, domMx, dom, domQuery, domProp, domGeom, domClass, domStyle, on, lang, declare, text) {

        dojo.provide('CameraWidgetForPhoneGap.widget.CameraWidgetForPhoneGap');
        
        // Declare widget.
        return declare('CameraWidgetForPhoneGap.widget.CameraWidgetForPhoneGap', [ _WidgetBase, _Widget, _Templated ], {

            /**
             * Internal variables.
             * ======================
             */
            _contextObj: null,
            _handle: null,

            // Extra variables
            _imageUrl: '',
            _previewNode: null,
            _imageNode: null,
            _tableHtml: null,

            targetWidth: 150,
            targetHeight: 150,

            // Template path
            templatePath: require.toUrl('CameraWidgetForPhoneGap/widget/templates/CameraWidgetForPhoneGap.html'),

            /**
             * Mendix Widget methods.
             * ======================
             */

            // PostCreate is fired after the properties of the widget are set.
            postCreate: function () {

                // postCreate
                console.log('CameraWidgetForPhonegap - postCreate');

                // Load CSS ... automaticly from ui directory

                // Setup widgets
                this._setupWidget();

                // Create childnodes
                this._createChildNodes();

                // Setup events
                this._setupEvents();

            },

            // Startup is fired after the properties of the widget are set.
            startup: function () {
                // postCreate
                console.log('CameraWidgetForPhonegap - startup');
            },

            /**
             * What to do when data is loaded?
             */

            update: function (obj, callback) {
                this._applyContext(obj, callback);
				this._setPicture('');
            },
            
            applyContext: function (obj, callback) {
                this._applyContext(obj, callback);
            },
            
            uninitialize: function () {
                //TODO, clean up only events
                if (this._handle) {
                    mx.data.unsubscribe(this._handle);
                }
            },


            /**
             * Extra setup widget methods.
             * ======================
             */
            _applyContext: function(obj, callback) {
                
                // Apply context
                if(typeof obj !== 'undefined' && obj !== null){
                    
                    if(typeof obj.trackId !== 'undefined'){
                        mx.data.get({
                            guid    : obj.trackId,
                            callback : lang.hitch(this, function(callback, obj) {
                                this._applyContext(obj, callback);
                            }, callback)
                        });
                    } else {
                        
                        this._contextObj = obj;

                        // startup
                        console.log('CameraWidgetForPhonegap - update');

                        // Release handle on previous object, if any.
                        if (this._handle) {
                            mx.data.unsubscribe(this._handle);
                        }

                        if (obj === null) {
                            // Sorry no data no show!
                            console.log('CameraWidgetForPhonegap  - update - We did not get any context object!');
                        } else {

                            // Load data
                            this._loadData();

                            // Subscribe to object updates.
                            if(typeof this._contextObj !== 'undefined' && this._contextObj !== null){
                                this._handle = mx.data.subscribe({
                                    guid: this._contextObj.getGuid(),
                                    callback: lang.hitch(this, function(obj){

                                        mx.data.get({
                                            guids: [obj],
                                            callback: lang.hitch(this, function (objs) {

                                                this._contextObj = objs[0];
                                                // Load data again.
                                                this._loadData();

                                            })
                                        });

                                    })
                                });
                            }
                        
                        }
                        
                    }
                    
                }
                
                // Execute callback.
                if(typeof callback !== 'undefined'){
                    callback();
                }
            },
            
            _setupWidget: function () {
            
                domClass.add(this.domNode, 'wx-CameraWidgetForPhoneGap-container');
            },

            // Create child nodes.
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

                tableHtml = mxui.dom.create('table', {
                    'class': 'wx-CameraWidgetForPhoneGap-table'
                });

                switch(this.imageLocation){

                    case 'Above':
                        trTop = mxui.dom.create('tr', {
                            'class': 'wx-CameraWidgetForPhoneGap-top-tr'
                        });
                        tdTop = mxui.dom.create('td', {
                            'class': 'wx-CameraWidgetForPhoneGap-top-td'
                        });

                        trBottom = mxui.dom.create('tr', {
                            'class': 'wx-CameraWidgetForPhoneGap-bottom-tr'
                        });
                        tdBottom = mxui.dom.create('td', {
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

                        trTop = mxui.dom.create('tr', {
                            'class': 'wx-CameraWidgetForPhoneGap-top-tr'
                        });
                        tdTop = mxui.dom.create('td', {
                            'class': 'wx-CameraWidgetForPhoneGap-top-td'
                        });

                        trBottom = mxui.dom.create('tr', {
                            'class': 'wx-CameraWidgetForPhoneGap-bottom-tr'
                        });
                        tdBottom = mxui.dom.create('td', {
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
                        trTable = mxui.dom.create('tr', {
                            'class': 'wx-CameraWidgetForPhoneGap-top-tr'
                        });
                        tdLeft = mxui.dom.create('td', {
                            'class': 'wx-CameraWidgetForPhoneGap-top-td'
                        });
                        tdRight = mxui.dom.create('td', {
                            'class': 'wx-CameraWidgetForPhoneGap-top-td'
                        });

                        tdLeft.appendChild(preview);
                        trTable.appendChild(tdLeft);

                        tdRight.appendChild(button);
                        trTable.appendChild(tdRight);

                        tableHtml.appendChild(trTable);
                        break;
                    case 'Right':
                        trTable = mxui.dom.create('tr', {
                            'class': 'wx-CameraWidgetForPhoneGap-top-tr'
                        });
                        tdLeft = mxui.dom.create('td', {
                            'class': 'wx-CameraWidgetForPhoneGap-top-td'
                        });
                        tdRight = mxui.dom.create('td', {
                            'class': 'wx-CameraWidgetForPhoneGap-top-td'
                        });

                        tdLeft.appendChild(button);
                        trTable.appendChild(tdLeft);

                        tdRight.appendChild(preview);
                        trTable.appendChild(tdRight);

                        tableHtml.appendChild(trTable);
                        break;
                    default:
                        trTable = mxui.dom.create('tr', {
                            'class': 'wx-CameraWidgetForPhoneGap-top-tr'
                        });
                        tdLeft = mxui.dom.create('td', {
                            'class': 'wx-CameraWidgetForPhoneGap-top-td'
                        });
                        tdRight = mxui.dom.create('td', {
                            'class': 'wx-CameraWidgetForPhoneGap-top-td'
                        });

                        tdLeft.appendChild(button);
                        trTable.appendChild(tdLeft);

                        tdRight.appendChild(preview);
                        trTable.appendChild(tdRight);

                        tableHtml.appendChild(trTable);
                        break;
                }

                this._tableHtml = tableHtml;

                this.domNode.appendChild(tableHtml);

				this.listen('save', this._sendFile);
            },

            // Attach events to newly created nodes.
            _setupEvents: function () {
                console.log('CameraWidgetForPhonegap - setup events');

            },

            /**
             * Interaction widget methods.
             * ======================
             */
            _loadData: function () {

                if(typeof this._contextObj !== 'undefined' && this._contextObj !== null){
                    if(!this._contextObj.inheritsFrom("System.FileDocument")) {
                        var span = mxui.dom.create('span', 
                                                   {'class': 'alert-danger'},
                                                   'Entity "' + this._contextObj.getEntity() + '" does not inherit from "System.FileDocument".');

                        domConstruct.empty(this.domNode);
                        this.domNode.appendChild(span);
                    }
                }
             
            },
            
            _setupButton: function() {
                var button = mxui.dom.create('button', {
                    'type': 'button',
                    'class': 'btn btn-primary wx-CameraWidgetForPhoneGap-button ' + this.buttonClass
                }, this.buttonText);

                this.connect(button, 'click', '_getPicture');
                return button;
            },

            _setupPreview: function() {
                this._previewNode = mxui.dom.create('div', {
                    'class': 'wx-CameraWidgetForPhoneGap-preview'
                });
                return this._previewNode;
            },

            _getPicture: function() {
                var success = null,
                    error = null;
                
                if (!navigator.camera) {
                    mx.ui.error('Unable to detect camera.');
                    return;
                }

                success = dojo.hitch(this, '_setPicture');

                error = function(e) {
                    if(typeof e.code !== 'undefined'){
                        mx.ui.error('Retrieving image from camera failed with error code ' + e.code);
                    }
                };

                // TODO: get rid of temp image files
                navigator.camera.getPicture(success, error, {
                    quality: 50,
                    destinationType: Camera.DestinationType.FILE_URL,
                    targetWidth: this.targetWidth,
                    targetHeight: this.targetHeight,
                    correctOrientation: true
                });
            },

            _setPicture: function(url) {
                this._imageUrl = url;
                this._setThumbnail(url);
                if (url !== '') {
                    this._executeMicroflow();
                }
            },

            _setThumbnail: function(url) {
                dojo.style(this._previewNode, {
                    'background-image': url ? 'url(' + url + ')' : 'none'
                });

                this._previewNode.style.display = url ? '' : 'none';
                this._previewNode.style.width = this.imageWidth ? this.imageWidth + 'px' : '100px';
                this._previewNode.style.height = this.imageHeight ? this.imageHeight + 'px' : '100px';
            },

            _sendFile: function(callback) {
                var options = null,
                    url = null,
                    success = null,
                    error = null,
                    ft = null;
                
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

                success = dojo.hitch(this, function() {
                    this._setPicture('');
                    callback();
                });

                error = function(e) {
                    mx.ui.error('Uploading image failed with error code ' + e.code);
                };

                ft = new FileTransfer();
                ft.upload(this._imageUrl, url, success, error, options);
            },

            _executeMicroflow : function () {
                if (this.onchangemf && this._contextObj) {
                    mx.processor.xasAction({
                        error       : function() {},
                        actionname  : this.onchangemf,
                        applyto     : 'selection',
                        guids       : [this._contextObj.getGuid()]
                    });
                }
            }

        });
    });

}());


