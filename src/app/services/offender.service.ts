import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ErrorService } from './error.service';
import { Subject, Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Offender, OffenderReport, ViolenceRating, Infraction, ForceLevel } from '../models/offender.model';
import { environment } from '../../environments/environment';
import { retryWithBackoff } from '../helpers/retryWithBackoff.helper';

@Injectable({
  providedIn: 'root'
})
export class OffenderService {

  constructor(private http: HttpClient, private errorService: ErrorService) { }

  private dataRefreshSource = new Subject();
  dataRefreshAnnounced$ = this.dataRefreshSource.asObservable();
  /**
   * Call this to signal all subscribers to refresh their data
   */
  refreshData()
  {
    console.log('Offender Report service data refresh called!');
    this.dataRefreshSource.next();
  }

  list(): Observable<Offender[]>
  {
    return this.http.get<Offender[]>(`${environment.baseUrl}/offender-report`).pipe(
      retryWithBackoff(),
      tap(result => console.log(`Fetched ${result.length} offender reports!`)),
      catchError(this.errorService.handleError('Fetch Offender', []))
    );
  }

  fetch_offender(offender_id: number): Observable<Offender>
  {
    return this.http.get<Offender>(`${environment.baseUrl}/offender-report/offender/${offender_id}`).pipe(
      retryWithBackoff(),
      tap(result => console.log(`Fetched offender id #${result.id}!`)),
      catchError(this.errorService.handleError('Fetch Offender'))
    );
  }

  fetch_report(report_id: number): Observable<OffenderReport>
  {
    return this.http.get<OffenderReport>(`${environment.baseUrl}/offender-report/${report_id}`).pipe(
      retryWithBackoff(),
      tap(result => console.log(`Fetched offender report id #${result.id}!`)),
      catchError(this.errorService.handleError('Fetch Offender Report'))
    );
  }

  list_mine(): Observable<OffenderReport[]>
  {
    return this.http.get<OffenderReport[]>(`${environment.baseUrl}/offender-report/mine`).pipe(
      retryWithBackoff(),
      tap(result => console.log(`Fetched ${result.length} offender reports of mine!`)),
      catchError(this.errorService.handleError('Fetch My Offender Reports', []))
    );
  }

  list_admin(): Observable<OffenderReport[]>
  {
    return this.http.get<OffenderReport[]>(`${environment.baseUrl}/offender-report/admin`).pipe(
      retryWithBackoff(),
      tap(result => console.log(`Fetched ${result.length} offender reports!`)),
      catchError(this.errorService.handleError('Fetch Admin Offender Reports', []))
    );
  }

  list_rating(): Observable<ViolenceRating[]>
  {
    return this.http.get<ViolenceRating[]>(`${environment.baseUrl}/offender-report/types`).pipe(
      retryWithBackoff(),
      tap(result => console.log(`Fetched ${result.length} violence ratings!`)),
      catchError(this.errorService.handleError('Fetch Violence Ratings', []))
    );
  }

  list_infractions(): Observable<Infraction[]>
  {
    return this.http.get<Infraction[]>(`${environment.baseUrl}/offender-report/infractions`).pipe(
      retryWithBackoff(),
      tap(result => console.log(`Fetched ${result.length} kinds of infractions!`)),
      catchError(this.errorService.handleError<any>('Fetch Infractions'))
    );
  }

  list_force_level(): Observable<ForceLevel[]>
  {
    return this.http.get<ForceLevel[]>(`${environment.baseUrl}/offender-report/force-levels`).pipe(
      retryWithBackoff(),
      tap(result => console.log(`Fetched ${result.length} kinds of force levels!`)),
      catchError(this.errorService.handleError<any>('Fetch Force Levels'))
    );
  }

  verify_handle(rsi_handle: string): Observable<boolean>
  {

    return this.http.get<boolean>(`${environment.baseUrl}/offender-reports/verify/${rsi_handle}`).pipe(
      retryWithBackoff(),
      tap(result => console.log(`Verifying rsi_handle!`)),
      catchError(this.errorService.handleError<any>('Verify Handle'))
    );
  }

  create(offender_report: OffenderReport): Observable<OffenderReport>
  {
    return this.http.post<OffenderReport>(`${environment.baseUrl}/offender-report`, { offender_report }).pipe(
      retryWithBackoff(),
      tap(result => console.log(`Created Offender Report with id# ${result.id}!`)),
      catchError(this.errorService.handleError<any>('Create Offender Report'))
    );
  }

  update(offender_report: OffenderReport): Observable<OffenderReport>
  {
    return this.http.patch<OffenderReport>(`${environment.baseUrl}/offender-report`, { offender_report }).pipe(
      retryWithBackoff(),
      tap(result => console.log(`Updated Offender Report with id# ${result.id}!`)),
      catchError(this.errorService.handleError<any>('Update Offender Report'))
    );
  }

  submit(offender_report: OffenderReport): Observable<OffenderReport>
  {
    return this.http.post<OffenderReport>(`${environment.baseUrl}/offender-report/submit`, { offender_report }).pipe(
      retryWithBackoff(),
      tap(result => console.log(`Submitted Offender Report with id# ${result.id}!`)),
      catchError(this.errorService.handleError<any>('Submit Offender Report'))
    );
  }
}
