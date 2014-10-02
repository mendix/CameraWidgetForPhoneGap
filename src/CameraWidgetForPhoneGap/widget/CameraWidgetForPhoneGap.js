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

            this._setupButton();
            this._setupPreview();

            this.listen('save', this._sendFile);
        },

        _setupButton: function() {
            var button = mxui.dom.create('button', {
                'type': 'button',
                'class': 'btn btn-primary wx-CameraWidgetForPhoneGap-button ' + this.buttonClass
            }, this.buttonText);

            this.connect(button, 'click', '_getPicture');
            this.domNode.appendChild(button);
        },

        _setupPreview: function() {
            this._previewNode = mxui.dom.create('div', {
                'class': 'wx-CameraWidgetForPhoneGap-preview'
            });

            this.domNode.appendChild(this._previewNode);
        },

        _getPicture: function() {
            if (!navigator.camera) {
                mx.ui.error('Unable to detect camera.');
                return;
            }

            var success = dojo.hitch(this, '_setPicture');

            var error = function(e) {
                mx.ui.error('Retrieving image from camera failed with error code ' + e.code);
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
        },

        _setThumbnail: function(url) {
            dojo.style(this._previewNode, {
               'background-image': url ? 'url(' + url + ')' : 'none'
            });

            this._previewNode.style.display = url ? '' : 'none';
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

        update: function(obj, callback) {
            this._contextObj = obj;
            this._setPicture('');

            callback();
        }
    });
})();
