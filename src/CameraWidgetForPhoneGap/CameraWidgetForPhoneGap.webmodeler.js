/*global React, window */


module.exports.preview = React.createClass({
    alignment:"horizontal",
    displayName: "Camera Widget",
    widgetClass: "wx-CameraWidgetForPhoneGap",

    componentWillMount: function () {
        var css = this.getCSS();
        this.addPreviewStyle(css, "widget-camera-phonegap");
    },

    render: function () {
        if (/above|below/.test(this.props.imageLocation)) {
            this.alignment = "vertical";
        } else {
            this.alignment = "horizontal";
        }

        var divPreview = React.DOM.div({ className: this.widgetClass + "-preview" + this.props.imageContainerClass + this.widgetClass + "-" + this.alignment });
        var button = React.DOM.button({ className: "btn btn-primary" + this.widgetClass + "-button" + this.props.buttonClass + this.widgetClass + "-" + this.alignment }, this.props.buttonText);
        var elements = [ divPreview, button ];

        if (/below|right/.test(this.props.imageLocation)) {
            elements.reverse();
        }

        return React.DOM.div(
            { className: "widget-camera-phonegap" },
            elements,
        );
    },

    addPreviewStyle: function (css, styleId) {
        // This workaround is to load style in the preview temporary till mendix has a better solution
        var iFrame = document.getElementsByClassName("t-page-editor-iframe")[0];
        var iFrameDoc = iFrame.contentDocument;
        if (!iFrameDoc.getElementById(styleId)) {
            var styleTarget = iFrameDoc.head || iFrameDoc.getElementsByTagName("head")[0];
            var styleElement = document.createElement("style");
            styleElement.setAttribute("type", "text/css");
            styleElement.setAttribute("id", styleId);
            styleElement.appendChild(document.createTextNode(css));
            styleTarget.appendChild(styleElement);
        }
    },

    getCSS: function () {
        return '.wx-CameraWidgetForPhoneGap {}.wx-CameraWidgetForPhoneGap .wx-CameraWidgetForPhoneGap-preview {    width: 34px;    height: 34px;    vertical-align: middle;    border-radius: 4px;    background-size: cover;}.wx-CameraWidgetForPhoneGap .wx-CameraWidgetForPhoneGap-button {}.wx-CameraWidgetForPhoneGap .wx-CameraWidgetForPhoneGap-preview.wx-CameraWidgetForPhoneGap-horizontal {    margin: 0 8px;}.wx-CameraWidgetForPhoneGap .wx-CameraWidgetForPhoneGap-preview.wx-CameraWidgetForPhoneGap-vertical {    margin: 8px 0;}.wx-CameraWidgetForPhoneGap .wx-CameraWidgetForPhoneGap-horizontal {    display: inline-block;}.wx-CameraWidgetForPhoneGap .wx-CameraWidgetForPhoneGap-vertical {    display: block;}';
    }

});

//# sourceURL=CameraWidgetForPhoneGap.webmodeler.js
