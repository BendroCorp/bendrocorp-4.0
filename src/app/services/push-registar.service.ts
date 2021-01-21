import { Injectable } from '@angular/core';
import { Platform } from '@ionic/angular';
// import { Push, PushOptions, PushObject } from '@ionic-native/push/ngx';
import { HttpErrorResponse } from '@angular/common/http';
import { UserService } from './user.service';
import { environment } from 'src/environments/environment.prod';
import { AppBadgeService } from './app-badge.service';

import {
  Plugins,
  PushNotification,
  PushNotificationToken,
  PushNotificationActionPerformed,
} from '@capacitor/core';

const { PushNotifications, Storage } = Plugins;

@Injectable({
  providedIn: 'root'
})
export class PushRegistarService {
  private deviceTypeId: 1|2;
  private readonly pushTokenStorageKey = 'push-token';

  constructor(
    private platform: Platform,
    // private push: Push,
    private userService: UserService,
    private appBadgeService: AppBadgeService) { }

  /**
   * Attempt to initialize push notifications on devices which are supported by the BendroCorp service.
   */
  async initPushNotifications() {
    if (this.platform.is('capacitor')) {
      // if we have already set a push notification token then skip
      if (await Storage.get({ key: this.pushTokenStorageKey })) {
        return;
      }

      // Request permission to use push notifications
      // iOS will prompt user and return if they granted permission or not
      // Android will just grant without prompting
      PushNotifications.requestPermission().then(result => {
        if (result.granted) {
          // Register with Apple / Google to receive push via APNS/FCM
          PushNotifications.register();
        } else {
          // Show some error
          console.warn('Push notification registration failed!');
        }
      });

      // On success, we should be able to receive notifications
      PushNotifications.addListener('registration',
        async (token: PushNotificationToken) => {
          alert('Push registration success, token: ' + token.value);

          const tokenValue = (token.value as string).replace('<', '').replace('>', '');

          // store the token
          await Storage.set({ key: this.pushTokenStorageKey, value: tokenValue });

          // determine the platform of the device so we can tell the API what its looking for
          if (this.platform.is('ios')) {
            this.deviceTypeId = 1;
          } else if (this.platform.is('android')) {
            this.deviceTypeId = 2;
          } else {
            console.warn('Unsupported push notification platform');
            return;
          }

          // send the token to the API for registration
          this.userService.registerForPushNotifications(tokenValue, this.deviceTypeId).subscribe((results) => {
            if (!(results instanceof HttpErrorResponse)) {
              console.log(`Push token ${tokenValue} registered on the BendroCorp API for this device.`);
            }
          });
        }
      );

      // Some issue with our setup and push will not work
      PushNotifications.addListener('registrationError',
        (error: any) => {
          alert('Error on registration: ' + JSON.stringify(error));
        }
      );

      // Show us the notification payload if the app is open on our device
      PushNotifications.addListener('pushNotificationReceived',
        (notification: PushNotification) => {
          alert('Push received: ' + JSON.stringify(notification));
        }
      );

      // Method called when tapping on a notification
      PushNotifications.addListener('pushNotificationActionPerformed',
        (notification: PushNotificationActionPerformed) => {
          alert('Push action performed: ' + JSON.stringify(notification));
        }
      );
    }


    // check to see if this is a physical device if not "Eject, Eject, Eject!"
    // if (!this.platform.is('cordova')) {
    //   console.warn('Push notifications not available. Must run on a physical device.');
    //   return;
    // }

    // // to check if we have permission
    // this.push.hasPermission()
    // .then((res: any) => {

    //   if (res.isEnabled) {
    //     console.log('We have permission to send push notifications');
    //   } else {
    //     console.log('We do not have permission to send push notifications');
    //   }

    // });

    // android stuff for later
    // Create a channel (Android O and above). You'll need to provide the id, description and importance properties.
    // this.push.createChannel({
    // id: "testchannel1",
    // description: "My first test channel",
    // // The importance property goes from 1 = Lowest, 2 = Low, 3 = Normal, 4 = High and 5 = Highest.
    // importance: 3
    // }).then(() => console.log('Channel created'));

    // // Delete a channel (Android O and above)
    // this.push.deleteChannel('testchannel1').then(() => console.log('Channel deleted'));

    // // Return a list of currently configured channels
    // this.push.listChannels().then((channels) => console.log('List of channels', channels))

    // to initialize push notifications

    // const options: PushOptions = {
    //   android: {},
    //   ios: {
    //       alert: 'true',
    //       badge: true,
    //       sound: 'true'
    //   }
    // };

    // const pushObject: PushObject = this.push.init(options);

    // pushObject.on('notification').subscribe((notification: any) => {
    //   console.log('Received a notification', notification);
    //   this.appBadgeService.fetchBadgeCount();
    //   // data.message,
    //   // data.title,
    //   // data.count,
    //   // data.sound,
    //   // data.image,
    //   // data.additionalData
    // });

    // pushObject.on('registration').subscribe((registration: any) => {
    //   // Register
    //   // registration.registrationId
    //   // this.platform.is("ios");
    //   // this.platform.is("android");
    //   console.log('Push registration recieved');
    //   console.log(registration);
    //   console.log('Registration id:');
    //   console.log(registration.registrationId);
    //   console.log('reg type:');
    //   console.log(registration.registrationType);

    //   if (registration && registration.registrationId) {
    //     const regId = (registration.registrationId as string).replace('<', '').replace('>', '');
    //     const storedRegId = localStorage.getItem('pushRegistrationId');

    //     // dont re-register if this device is already registered
    //     if (regId !== storedRegId) {
    //       if (this.platform.is('ios')) {
    //         // iOS = 1 for dev, 2 = prod
    //         const envId = (environment.production) ? 2 : 1;
    //         this.userService.registerForPushNotifications(regId, envId, registration).subscribe((results) => {
    //           if (!(results instanceof HttpErrorResponse)) {
    //             // save back in local storage
    //             localStorage.setItem('pushRegistrationId', regId);
    //             console.log('Device registered with BendroCorp API', registration);
    //           }
    //         });
    //       } else if (this.platform.is('android')) {
    //         // Android will eventually by 3 for dev, 4 for prod
    //         // console.error('Android is currently not supported.');
    //         this.userService.registerForPushNotifications(regId, 3, registration).subscribe((results) => {
    //           if (!(results instanceof HttpErrorResponse)) {
    //             // save back in local storage
    //             localStorage.setItem('pushRegistrationId', regId);
    //             console.log('Device registered with BendroCorp API', registration);
    //           }
    //         });
    //       } else {
    //         console.warn('Device not currently supported for push notifications.');
    //       }
    //     }
    //   } else {
    //     console.warn('Something went wrong and the device could not be registered!');
    //   }
    // });

    // pushObject.on('error').subscribe(error => {
    //   console.error('Error with Push plugin', error);
    //   // e.message
    // });
  }
}
