import { NgModule, Component } from '@angular/core';
import { AsyncJobQueueService } from './async-job-queue.service';


// The point of this module is to provide an instance of the AsyncJobQueueService
//  for use in testing.



@Component({
  selector: 'AsyncJobQueueServicecomponent',
  template: `<div></div>`
})
export class AsyncJobQueueServiceComponent {
	constructor(private srvc: AsyncJobQueueService) {

	}

	getService(): AsyncJobQueueService {
		return this.srvc;
	}
}

@NgModule({
	declarations: [ AsyncJobQueueServiceComponent ],
	providers: [ AsyncJobQueueService ]
})

// ENSURE TESTS STILL PASS

/* tslint:disable */ class AsyncJobQueueServiceComponentModule { } /* tslint:enable */