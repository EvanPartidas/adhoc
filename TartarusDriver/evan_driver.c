#include <linux/module.h>
#include <linux/kernel.h>
#include <linux/slab.h>
#include <linux/init.h>
#include <asm/unaligned.h>
#include <asm/byteorder.h>
#include <linux/device.h>
#include <linux/hid.h>
#include <linux/dmi.h>
#include <linux/usb/input.h>
#include <linux/uaccess.h>
/*
 * HID Stuff
 * 0 1 c x = green light to x
 * 0 1 d x = blue light to x
 * 0 1 e x = yellow light to x
 * 3 1 5 x = set brightness of keys to x
 * 2 1 5 2 = set mode to pulsate (not sure what arguments do.)
 */

/*
 * Mapping stuff
 */
static const int keypad_map[][2] = {
	{15,0},
	{16,1},
	{17,2},
	{18,3},
	{19,4},
	{58,5},
	{30,6},
	{31,7},
	{32,8},
	{33,9},
	{42,10},
	{44,11},
	{45,12},
	{46,13},
	{47,14},
	{56,15},//Thumb clicker
	{57,16},//Spacebar
	{103,17},//Up
	{108,18},//Down
	{105,19},//Left
	{106,20}//Right	
};

static const int default_map[] = {15,16,17,18,19,58,30,31,32,33,42,44,45,46,47,56,57,103,108,105,106};

#define USB_VENDOR_ID 0x1532
#define USB_PRODUCT_ID 0x0201

//Declaring
static struct usb_class_driver keypad_class;
static struct hid_driver razer_keypad_driver;

struct hid_keypad {
	struct hid_device *hdev;
	struct usb_device *udev;
	int arrow_bitmask;
	int minor;
	//int map[21]; This might be causing my module to crash so often
};

static inline void keypad_delete(struct hid_keypad *dev)
{
	printk(KERN_NOTICE "Freeing data...");
	
	kfree(dev);
	printk(KERN_NOTICE "Data freed");
}
/*Start cut out register usb
static int keypad_release(struct inode *inode, struct file *file)
{	
	struct usb_driver *usb_drv;
	struct usb_interface *intf;
	int minor = iminor(inode);
	usb_drv = to_usb_driver(&(razer_keypad_driver.driver));
	intf = usb_find_interface(usb_drv,minor);
	printk(KERN_INFO "Detected a release!\n");
	return 0;
}

static int keypad_open(struct inode *inode, struct file *file)
{
	printk(KERN_INFO "Detected an open!\n");
	return 0;
}

static ssize_t keypad_read(struct file *file, char __user *user_buf, size_t len, loff_t *ppos)
{
	printk(KERN_INFO "Detected a reads!");
	char to_cpy[] = "hello";
	printk(KERN_INFO "Copy returned: %ld",copy_to_user(user_buf,to_cpy,5));
	return 0;	
}

static ssize_t keypad_write(struct file *file, const char __user *user_buf, size_t
		count, loff_t *ppos)
{
	printk(KERN_INFO "Detected a write!");
	return 0;
}

static struct file_operations keypad_fops = {
	.owner = THIS_MODULE,
	.release = keypad_release,
	.write = keypad_write,
	.read = keypad_read,
	.open = keypad_open
};

static struct usb_class_driver keypad_class = {
	.name = "keypad%d",
	.fops = &keypad_fops,
	.minor_base = 0
};
end cut out register usb
*/
static int keypad_probe(struct hid_device *hdev,const struct hid_device_id *id)
{
	int retval;
	struct usb_interface *intf = to_usb_interface(hdev->dev.parent);
	struct usb_device *usb_dev = interface_to_usbdev(intf);
	struct hid_keypad *dev;
	struct usb_driver *usb_drv;
	
	printk(KERN_INFO "Device plugged in (%04X,%04X) :)))", id -> vendor, id -> product);
	retval=0;
	dev = kmalloc(sizeof(dev),GFP_KERNEL);
	if(!dev)
	{
		hid_err(hdev, "HEY kmalloc failed\n");
		retval = -ENOMEM;
		goto exit;
	}
	dev->arrow_bitmask = 0;
	/*
	usb_drv = to_usb_driver(&(razer_keypad_driver.driver));
	
	if (usb_register_dev(intf,&keypad_class)) {
		// something prevented us from registering this driver 
		hid_err(hdev,"Not able to get a minor for this device.\n");
		usb_set_intfdata(intf, NULL);
		retval = -ENOMEM;
		goto exit_free;
	}
	
	hid_info(hdev,"Allocated file [keypad%d]\n",intf->minor);
	dev->minor = intf->minor; 
	*/
	//usb_set_intfdata(intf,dev);
	hid_set_drvdata(hdev,dev);
	//dev_set_drvdata(&hdev->dev,dev);

	if(hid_parse(hdev)) {
		hid_err(hdev, "parse failed\n");
		retval = -ENOMEM;
		goto exit_free;
	}

	if(hid_hw_start(hdev, HID_CONNECT_DEFAULT))
	{
		hid_err(hdev, "hw start failed\n");
		retval = -ENOMEM;
		goto exit_free;
	}

	return 0;
exit_free:
	keypad_delete(dev);
exit:
	return retval;
}

void on_urb_complete(struct urb *urb)
{
	struct hid_device *hdev = urb->context;
	hid_info(hdev,"Callback complete, freeing urb...\n");
	usb_free_urb(urb);
}

void send_cmd(struct hid_device *hdev,u8 cmd_code,u8 arg1,u8 arg2,u8 arg3)
{
	int i;
	struct usb_interface *intf;
	struct usb_device *usb_dev;
	struct usb_ctrlrequest *cr;
	struct urb *keypad_request;
	u8 *buf = kmalloc(sizeof(u8)*0x5a,GFP_KERNEL);
	//These first 5 arguments are some bs that razer has, they don't seem to ever change so I assumed they are for errors or flexibility with future firmware
	buf[0] = 0;
	buf[1] = 0xff;
	buf[2] = 0;
	buf[3] = 0;
	buf[4] = 0;
	buf[5] = 3;//Cmd size
	buf[6] = 3;//Cmd class
	buf[7] = cmd_code;//Cmd val
	buf[8] = arg1;//arg1
	buf[9] = arg2;//arg2
	buf[10] = arg3;//arg3
	for(i=11;i<0x5a-2;i++)
		buf[i]=0;
	buf[88] = cmd_code^arg1^arg2^arg3;//Hardcoding the xor checksum of index 2 through 87
	buf[89] = 0;//Some reserved byte idk, more razer bs
	intf = to_usb_interface(hdev->dev.parent);
	usb_dev = interface_to_usbdev(intf);
        
	cr = kmalloc(sizeof(struct usb_ctrlrequest),GFP_KERNEL);
	keypad_request = usb_alloc_urb(0,GFP_KERNEL);
	
	cr->bRequestType = USB_TYPE_CLASS | USB_RECIP_INTERFACE;
	cr->bRequest = 0x9;//HID_REQ_SET_REPORT
	cr->wValue = 0x300;//Why 300? Not sure I probably have to read the big boy usb spec again.
	cr->wIndex = 2;//I think? might be: intf->cur_altsetting->desv.bInterfaceNumber
	cr->wLength = 0x5a;//This is the length of the buffer
	
	usb_fill_control_urb(keypad_request,usb_dev,usb_sndctrlpipe(usb_dev,0),
		cr,buf,0x5a,on_urb_complete,hdev);
	
	usb_submit_urb(keypad_request,GFP_KERNEL);
}

static int keypad_event(struct hid_device *hdev, struct hid_field *field, struct hid_usage *usage, __s32 value)
{
	struct hid_keypad *dev;
	int mask;
	u8 brightness;
	dev = hid_get_drvdata(hdev);
	hid_info(hdev,"Event Info: [Code: %d Value: %d]\n",usage->code,value);
	
	switch(usage->code)
	{
		case KEY_UP: mask=0x10; break;
		case KEY_RIGHT: mask=0x8; break;
		case KEY_DOWN: mask=0x4; break;
		case KEY_LEFT: mask=0x1; break;
		default: mask = 0;
	}
	if(mask)
	{
		if(value)
		{
			dev->arrow_bitmask |= mask;
		}
		else
		{
			dev->arrow_bitmask &= ~mask;
		}
		switch(dev->arrow_bitmask)
		{
			case 0x4: brightness = 0x00; break;
			case 0xc: brightness = 0x40; break;
			case 0x8: brightness = 0x49; break;
			case 0x18: brightness = 0xa3; break;
			case 0x10: brightness = 0x7f; break;
			case 0x11: brightness = 0xc0; break;
			case 0x1: brightness = 0xe0; break;
			case 0x5: brightness = 0xff; break;
		}
		hid_info(hdev,"brightness: %hhd\n",brightness);
		//send_cmd(hdev,3,1,5,brightness);
		hid_set_drvdata(hdev,dev);
	}
	return 0;
}

static int keypad_raw_event(struct hid_device *hdev, struct hid_report *report, u8 *data, int size)
{
	/*
	int i,index;
	char str[size*9+1];
	hid_info(hdev,"Raw Event Triggered\n");
	str[size*9] = 0;
	index = 0;
	for(i=0;i<size*9;index++)
	{
		int j;
		for(j=7;j>=0;j--)
		{
			str[i++] = ((data[index]>>j)&1)?'1':'0';
		}
		str[i++] = ' ';
	}
	hid_info(hdev,"Raw data (len: %d): %s\n",size,str);*/
	return 0;
}

static void keypad_disconnect(struct hid_device *hdev)
{
	struct hid_keypad *dev;
	struct usb_interface *intf = to_usb_interface(hdev->dev.parent);
	struct usb_driver *usb_drv;
	dev = hid_get_drvdata(hdev);
	hid_hw_stop(hdev);
	keypad_delete(dev);
	/*
	usb_drv = to_usb_driver(&(razer_keypad_driver.driver));
	//lock_kernel();
	printk(KERN_INFO "Giving back minor number");
	usb_deregister_dev(intf,&keypad_class);
	//unlock_kernel();
	*/
	
	printk(KERN_INFO "Keypad Disconnected :(");
}

static struct hid_device_id keypad_table[] = 
{
	{HID_USB_DEVICE(USB_VENDOR_ID,USB_PRODUCT_ID)},
	{}/* Terminating Entry */
};

MODULE_DEVICE_TABLE(hid,keypad_table);

static struct hid_driver razer_keypad_driver =
{
	.name = "Razer Tartarus Keypad Driver",
	.id_table = keypad_table, 
	.probe = keypad_probe,
	.remove = keypad_disconnect,
	.event = keypad_event,
	.raw_event = keypad_raw_event
};

module_hid_driver(razer_keypad_driver);

MODULE_LICENSE("GPL");
MODULE_AUTHOR("Evan_Partidas");
MODULE_DESCRIPTION("A driver for a Razer Tartarus Kepad");
