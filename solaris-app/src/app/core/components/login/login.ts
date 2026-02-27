import { Component, inject, OnInit } from '@angular/core';
import { AuthService } from '../../../shared/services/auth.service';
import { AppInitService } from '../../../shared/services/app-init.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.html',
  styleUrl: './login.scss',
  standalone: false
})
export class Login implements OnInit {

  form: any = {
    username: undefined,
    password: undefined
  };
  invalidText: string = 'username or password invalid!';
  animate: any;
  animateClass: string = 'valid';


  private authService = inject(AuthService);
  private appLoadService = inject(AppInitService);
  private router = inject(Router);

  constructor() { }

  ngOnInit() {
  }

   async login(): Promise<any> {
    //console.log(this.form)
    ////console.log(this.isEven())
    if(this.form.username != '' && this.form.password != ''){
      try {
        await this.authService.login(this.form.username, this.form.password); 
        //console.log("login success")   
        const destination = sessionStorage.getItem('navigate');
        console.log(destination)
        if(destination){
          this.router.navigate([destination]);
        } else {
           this.router.navigate([this.appLoadService.defaultRoute]);
        }
      } catch (err) {
        this.invalidText = 'username or password invalid!';
        this.animateClass = 'invalid';
        this.router.navigate(['login']);
        setTimeout(() =>{
          this.changeClass();
        },1000);
      }
    } else {
      this.invalidText = 'please fill username or password!'
      this.animateClass = 'invalid';
      this.router.navigate(['login']);
      setTimeout(() =>{
        this.changeClass();
      },1000);
    }
  }

  changeClass() {
    this.animateClass = 'invalidcheck';
  }

 

}

