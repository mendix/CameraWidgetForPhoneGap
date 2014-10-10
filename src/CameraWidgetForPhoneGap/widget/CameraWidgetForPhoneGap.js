(function() {
    'use strict';

    dojo.declare('CameraWidgetForPhoneGap.widget.CameraWidgetForPhoneGap', mxui.widget._WidgetBase, {

        _imageUrl: '',
        _contextObj: null,
        _previewNode: null,
        _imageNode: null,

        targetWidth: 150,
        targetHeight: 150,


        postCreate: function() {
            dojo.addClass(this.domNode, 'wx-CameraWidgetForPhoneGap-container');

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

            var tableHtml = mxui.dom.create('table', {
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
                    var trTable = mxui.dom.create('tr', {
                        'class': 'wx-CameraWidgetForPhoneGap-top-tr'
                    }), tdLeft = mxui.dom.create('td', {
                        'class': 'wx-CameraWidgetForPhoneGap-top-td'
                    }), tdRight = mxui.dom.create('td', {
                        'class': 'wx-CameraWidgetForPhoneGap-top-td'
                    });

                    tdLeft.appendChild(preview);
                    trTable.appendChild(tdLeft);

                    tdRight.appendChild(button);
                    trTable.appendChild(tdRight);

                    tableHtml.appendChild(trTable);
                    break;
                case 'Right':
                default:
                    var trTable = mxui.dom.create('tr', {
                        'class': 'wx-CameraWidgetForPhoneGap-top-tr'
                    }), tdLeft = mxui.dom.create('td', {
                        'class': 'wx-CameraWidgetForPhoneGap-top-td'
                    }), tdRight = mxui.dom.create('td', {
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
            if (!navigator.camera) {
                mx.ui.error('Unable to detect camera.');
                return;
            }

            var success = dojo.hitch(this, '_setPicture');

            var error = function(e) {
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
            if (!this._imageUrl) {
                callback();
                return;
            }

            var options = new FileUploadOptions();
            options.fileKey = 'mxdocument';
            options.fileName = this._imageUrl.substr(this._imageUrl.lastIndexOf('/') + 1);
            options.mimeType = 'image/jpeg';

            var url = mx.appUrl +
                'file?guid=' + this._contextObj.getGuid() +
                '&csrfToken=' + mx.session.getCSRFToken();

            var succes = dojo.hitch(this, function() {
                this._setPicture('');
                callback();
            });

            var error = function(e) {
                mx.ui.error('Uploading image failed with error code ' + e.code);
            };

            var ft = new FileTransfer();
            ft.upload(this._imageUrl, url, succes, error, options);
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
        },

        update: function(obj, callback) {
            this._contextObj = obj;
            this._setPicture('');

            callback();
        }
    });
})();
