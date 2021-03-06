import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectorRef, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { GestureController, LoadingController, Platform } from '@ionic/angular';
import { AuthService } from '../auth.service';
import { LoginRequest } from '../models/user.model';
import { Plugins } from '@capacitor/core';
import { environment } from 'src/environments/environment';
import { LongPressDirective } from '../directives/long-press.directive';
const { Toast, Device } = Plugins;

@Component({
  selector: 'app-auth',
  templateUrl: './auth.page.html',
  styleUrls: ['./auth.page.scss'],
  viewProviders: [LongPressDirective]
})
export class AuthPage implements OnInit {
  @ViewChild('email') emailElement: ElementRef;
  login: LoginRequest = {
    email: '',
    password: ''
  } as LoginRequest;

  // vars
  authInProgress = false;
  loadingIndicator: any;
  isWeb: boolean;
  isiOS: boolean;
  showLoginDebug = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private platform: Platform,
    private gestureCtrl: GestureController,
    private ref: ChangeDetectorRef,
    private loading: LoadingController
  ) { }

  /**
   * Call the login service with the filled in form object and attempt to authenticate the user
   */
  async doLogin()
  {
    const { uuid, operatingSystem, platform } = await Device.getInfo();
    this.ref.detectChanges();

    // show ticker
    this.loadingIndicator = await this.loading.create({
      message: 'Authorizing'
    });
    await this.loadingIndicator.present();

    // set loading state
    this.authInProgress = true;

    this.authService.login(
      {
        email: this.login.email,
        password: this.login.password,
        code: this.login.code,
        device: `${platform}:${operatingSystem}:${uuid}`
      }
      )
    .subscribe(async (response) => {
      if (!(response instanceof HttpErrorResponse)) {
        await this.authService.storeAuthResponse(response);
        this.authService.announceAuthUpdate('LOGIN');
        this.router.navigateByUrl('/');
      } else {
        await Toast.show({
          text: response.error.message,
          duration: 'long'
        });
      }

      // reset loading state
      this.authInProgress = false;
      this.loadingIndicator.dismiss();
    });
  }

  showDebug() {
    console.log('show debug test');
    this.showLoginDebug = !this.showLoginDebug;
  }

  ionViewWillEnter() {
    this.login = {
      email: '',
      password: ''
    } as LoginRequest;
  }

  async ngOnInit() {
    this.isWeb = this.platform.is('desktop');
    this.isiOS = this.platform.is('ios');

    const { uuid } = await Device.getInfo();
    if (!environment.production) {
      console.log(uuid);
    }
  }
}
