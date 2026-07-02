import { Component, inject, input, ChangeDetectionStrategy, effect} from '@angular/core';
import { ResponseRealtimeModel } from '../../../../../../shared/models/response.model';
import { TooltipFormat } from '../../../../../../shared/services/tooltip-format';


@Component({
  selector: 'app-summary-card',
  standalone: false,
  templateUrl: './summary-card.html',
  styleUrl: './summary-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SummaryCard {
  today_curr = input<ResponseRealtimeModel>();
  today_prev = input<ResponseRealtimeModel>();
  month_curr = input<ResponseRealtimeModel>();
  month_prev = input<ResponseRealtimeModel>();
  pr_curr = input<ResponseRealtimeModel>();
  pr_prev = input<ResponseRealtimeModel>();
  avai_curr = input<ResponseRealtimeModel>();
  avai_prev = input<ResponseRealtimeModel>();
  revenue_curr = input<ResponseRealtimeModel>();
  revenue_prev = input<ResponseRealtimeModel>();
  co2_curr = input<ResponseRealtimeModel>();
  co2_prev = input<ResponseRealtimeModel>();
  co2_cumulative = input<ResponseRealtimeModel>();
  tooltipSrv = inject(TooltipFormat);

  slaTarget = 97;

  constructor() {
    effect(() => {
      // console.log('today_curr', this.today_curr());
      // console.log('today_prev', this.today_prev());
    })
  }

  checkValueStatus(cur: number | undefined, prev: number | undefined){
    if(!cur || !prev){
      return 'nodata';
    };

    if(cur > prev){
      return 'plus';
    } else {
      return 'minus';
    }
  }

  getDiffValue(cur: number | undefined, prev: number | undefined, factor1: number = 1, factor2: number = 1){
    if(!cur || !prev){
      return 0;
    };

    return Math.abs((((cur/factor1)-(prev/factor2))/(prev/factor2))*100);
  }

  getTargetPercent(cur: number | undefined, prev: number | undefined, factor1: number = 1, factor2: number = 1){
    if(!cur || !prev){
      return 0;
    };

    return (cur/prev)*100;
  }

  checkSLA(cur: ResponseRealtimeModel | undefined){
    if(!cur){
      return 'nodata';
    };

    return cur.Value >= this.slaTarget ? 'pass' : 'fail';
  }
}
