# Camera Widget For PhoneGap

The camera widget is a widget that enables PhoneGap native camera functionality within your Mendix mobile application.

## Contributing

For more information on contributing to this repository visit [Contributing to a GitHub repository](https://world.mendix.com/display/howto50/Contributing+to+a+GitHub+repository)!

## Configuration

Place the widget in a dataview where you want the button to be placed. Make sure this form is reachable from a mobile application.

### Appearance
#### Image container class
The class that will be set on the image preview container.

#### Width
The width of the image preview.

#### Height
The height of the image preview.

#### Image Location
Where the image preview will be shown relative to the button.

### Button
#### Label
The label text that is shown on the button.

#### Class
An optional class to be placed directly on the button dom node.

### Events
#### On change microflow
An optional microflow that will be triggered when an image is taken.

### Image quality
Be aware that setting this higher will be more taxing and will take longer to upload.

#### Quality width
The width of the image that is eventually stored and send to the application, between 0 and 100. 
#### Quality height
The height of the image that is eventually stored and send to the application, between 0 and 100.

