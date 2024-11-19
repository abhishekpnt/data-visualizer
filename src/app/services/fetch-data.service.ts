import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FetchDataService {

  private baseUrl = 'http://localhost:3000/user-activity';

  constructor(private http: HttpClient) {}

    getUserActivity(): Observable<any> {
      // const params = { typeIdentifier, orgId };
      return this.http.get<any>(this.baseUrl);
    }
  }

