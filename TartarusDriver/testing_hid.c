#include <linux/types.h>
#include <linux/input.h>
#include <linux/hidraw.h>
#include <sys/ioctl.h>
#include <sys/types.h>
#include <sys/stat.h>
#include <fcntl.h>
#include <unistd.h>
#include <stdio.h>
#include <string.h>
#include <stdlib.h>
#include <errno.h>


int main(int argc,char **argv)
{
	char buf[256];
	int fd;
	if(argc<1)
	{
		printf("Must specify hidraw file\n");
		exit(1);
	}
	fd = open(argv[1], O_RDWR|O_NONBLOCK);
	if(fd<0)
	{
		perror("Unable to open device\n");
		return 1;
	}

	for(int i=2;i<argc;i++)
	{
		sscanf(argv[i],"%hhx",&buf[i-2]);
	}
	printf("\n");
	int res = write(fd, buf, argc-2);
	if (res < 0) {
		printf("Error: %d\n", errno);
		perror("write");
	} else {
		printf("write() wrote %d bytes to file %s\n", res, argv[1]);
	}


	return 0;
}
