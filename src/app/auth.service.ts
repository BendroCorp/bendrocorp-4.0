import { Injectable, OnInit } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { Platform } from '@ionic/angular';
import { TokenResponse } from './models/token-response.model';
import { environment } from '../environments/environment';
import { Plugins } from '@capacitor/core';
import { tap, catchError } from 'rxjs/operators';
import { ErrorService } from './services/error.service';
import { StoredToken } from './models/stored-token.model';
import { JwtHelperService } from '@auth0/angular-jwt';
import * as moment from 'moment';
import { UserSessionResponse } from './models/user.model';
import { Router } from '@angular/router';
import { retryWithBackoff } from './helpers/retryWithBackoff.helper';
const { Toast, Storage, Device } = Plugins;

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private deviceUuid: string;

  constructor(
    private http: HttpClient,
    private error: ErrorService,
    private platform: Platform,
    private router: Router
  ) { }

  // An observable which can be subcribed to which allows you to detect when a data refresh is announced.
  private dataRefreshSource = new Subject();
  AuthUpdateAnnounced$ = this.dataRefreshSource.asObservable();

  /**
   * Trigger the service to send a refresh notification to all subscribers
   */
  announceAuthUpdate(eventType: 'LOGIN'|'LOGOUT') {
    this.dataRefreshSource.next(eventType);
    console.log('announceAuthUpdate called and sent!');
  }

  login(params: { email: string, password: string, code?: number, device: string }): Observable<TokenResponse> {
    // this.deviceUuid = uuid;
    const { email, password, code, device } = params;
    // TODO: If platform web request refresh token as cookie
    const session = { email, password, code, device, offline_access: true };

    return this.http.post<TokenResponse>(`${environment.baseUrlRoot}/auth`, { session }).pipe(
      tap(async result => {
        Toast.show({ text: 'Login Successful!' });
      }),
      catchError(this.error.handleError<any>('Login', null, true))
    );
  }

  async logout() {
    await Storage.remove({ key: 'userSession' });
  }

  refreshLogin(refreshToken: TokenResponse): Observable<TokenResponse> {
    const grant_type = 'refresh_token';
    const refresh_token = refreshToken.refresh_token;
    const session = { grant_type, refresh_token };

    return this.http.post<TokenResponse>(`${environment.baseUrlRoot}/auth`, { session }).pipe(
      retryWithBackoff(),
      tap(result => {
        console.log('Login refreshed!');
      }),
      catchError(this.error.handleError<any>('Login', null, true))
    );
  }

  async checkAndRefreshAccessToken(override: boolean = false, skipLoginRedirect: boolean = false): Promise<string|HttpErrorResponse> {
    return new Promise (async (results, error) => {
      const authResponse = await this.getAuthResponse();

      // initial verification, do we have a stored token set?
      if (authResponse) {
        // so we have a token set available
        // is the token set expired?
        if (await this.isAuthorized() || override) {
          // return the valid, not expired access token
          console.log('checkAndRefreshAccessToken(): New token did not have to be fetched');
          results(authResponse.access_token);
        } else {
          // try to retrieve a new token if the current token is expired
          this.refreshLogin(authResponse).subscribe((response) => {
            if (!(response instanceof HttpErrorResponse)) {
              console.log('checkAndRefreshAccessToken(): New token retrieved');
              this.storeAuthResponse(response);
              this.announceAuthUpdate('LOGIN');
              results(response.access_token);
            } else {
              response.headers.keys();
              error(response);
              if (response.status === 401 || (response.status === 404 && response.error.message.includes('Refresh token not found, is expired'))) {
                this.redirectToLogin();
              }
            }
          });
        }
      } else {
        if (!skipLoginRedirect) {
          this.redirectToLogin();
        } else {
          results(null); // you still have to resolve it with something or the promise never returns
        }
      }
    });
  }

  async storeAuthResponse(token: TokenResponse) {
    await Storage.set({ key: 'userSession', value: JSON.stringify(token) });
  }

  async getAuthResponse(): Promise<TokenResponse> {
    const result = await Storage.get({ key: 'userSession' });
    return JSON.parse(result.value) as TokenResponse;
  }

  async retrieveUserSession(): Promise<UserSessionResponse> {
    const session = await this.getAuthResponse();
    if (session) {
      const jwtHelper = new JwtHelperService();
      const decodedToken = jwtHelper.decodeToken(session.access_token);

      return {
        id: decodedToken.sub,
        roles: decodedToken.roles,
        first_name: decodedToken.given_name,
        last_name: decodedToken.family_name,
        avatar: decodedToken.avatar,
        expires: decodedToken.exp,
        tfa_enabled: decodedToken.tfa_enabled,
        character_id: decodedToken.character_id,
        job_title: decodedToken.job_title,
        subscriber: decodedToken.subscriber,
        name: decodedToken.name
      } as UserSessionResponse;
    }
  }

  async hasClaim(roleId: number): Promise<boolean> {
    if (this.isAuthorized()) {
      if ((await this.retrieveUserSession() as UserSessionResponse).roles.length > 0) {
        const roles = (await this.retrieveUserSession() as UserSessionResponse).roles;
        const claim = roles.find(x => x === roleId);
        if (claim === roleId) {
          return true;
        }
      }
      return false;
    } else {
      return false;
    }
  }

  async isAuthorized(): Promise<boolean> {
    const auth = await this.retrieveUserSession();
    if (auth) {
      const expires = await this.getExpiration();
      const expireResults = moment().isBefore(expires);
      return expireResults;
    }

    return false;
  }

  async getExpiration() {
    const userObject = await this.retrieveUserSession();
    return moment.unix(userObject.expires);
  }

  preservePath() {
    if (!window.location.pathname.includes('auth')) {
      localStorage.setItem('bendro:redirect:path', window.location.pathname);
    }
  }

  async redirectToLogin() {
    await this.logout();
    this.preservePath();
    this.router.navigateByUrl('/auth');
  }

  async hasDebugClaim(): Promise<boolean> {
    return this.hasClaim(-99);
  }
}
