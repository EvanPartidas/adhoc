This folder holds terribly written driver code for the Razer Tartarus Keypad on linux.

-The file evan_driver.c houses the meat of the code. It is not meant to be admired. It was a learning experience.

-The files testing_hid.c and spamhid were made to spam raw byte data into the hid output to the device. These were used to figure out how to play with the lights.

-The file evan_driver.rules houses a file of udev rules. This was necessary because I could not find another way to get the driver to attach to the device, it kept getting stolen by the generic-hid driver linux provides. This rule allowed me to set the exception for the specific usb vendor and product ID.
