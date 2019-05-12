import { Injectable } from '@angular/core';
// import { Observable } from 'rxjs/Observable';
// import { Observer } from 'rxjs/Observer';
import * as Rx from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AsyncJobQueueService {

	constructor() {

	}

	getQueue(doWorkFunc /* must return a promise */) {

		if (!doWorkFunc) {
			throw new Error("A null or undefined function was passed to the async-job-queue.");
		}
		
		// given a function, this method, getQueue(), will allow you to queue up,
		//	 to run asynchronously, a number of calls to that function.

		let emitter = undefined;

		// what is 'observable' is the data that people give to a function; that is what runs through this queue.
		let asyncQueue = Rx.Observable.create(e => emitter = e);

		// when that data is presented to the queue, the queue can take one of three actions. We define them here.
		let observer = {
			next:
			(data) => {
				console.log("The observer just got some data!!");
				// execute a job
				try {
					let v = doWorkFunc(data);

					if (!v) throw new Error("The function given to async-job-queue to do work, did not return a promise.")
					
					v.then(() => { console.log("the observer call to the doWorkFunc has finished. Now calling the done func"); data.doneFunc(); })
				} catch (err) {
					console.log("Error: " + err)
				}
			},
			err:
			(err) => { 
				console.log("Error " + err);
			},
			complete:
			() => { 
				console.log("Complete called on observer"); 
			}
		};

		// Here we tell the queue, here's what to do when something happens.
		let disposable = asyncQueue.subscribe(observer.next, observer.err, observer.complete);

		// above is the basis of a queue which will asynchronously run a function for as many times as you call
		//  it with data. What we need now is to throttle this a bit, so that only a few executions of our function
		//  can happen at any given time. This object we return does that throttling. A client will be able to call
		//  the queue with data as many times as they would like, and this object will ensure they all run, but only
		//  a few at at time, not all of them.

		let _total = 0;
		let maxConcurrency = 5;
		let fullQueue = [];
		let throttledQueue = [];

		let rtn = {
			next: (data) => { 

				console.log("inside getQueue().next(data)");

				let inst = {};
				let instId = ++_total;

				inst["id"] = instId;
				inst["data"] = data;

				data["doneFunc"] = () => { 
					console.log("now inside the done() func. throttled queue has a length of " + throttledQueue.length);
					throttledQueue = throttledQueue.filter((inst) => { 
						inst.id != instId;
					})
					console.log("throttledQueue now has " + throttledQueue.length);

					// process the next item in the list
					let nextInst = fullQueue.pop();

					if (nextInst) {
						console.log("supposedly removed one from the throttled queue, so now the full queue has work, so we process it");
						emitter.next(nextInst["data"]);
					}
				}

				if (throttledQueue.length < maxConcurrency) {
					console.log("throttledqueue length has room to take work, so we're giving it.");
					throttledQueue.push(inst);

					console.log("telling the emitter we have some data");
					emitter.next(inst["data"]);
				} else {
					fullQueue.push(inst);
				}
			}
		}

		return rtn;
	}
}