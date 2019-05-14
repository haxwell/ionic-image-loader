import { Injectable } from '@angular/core';
import * as Rx from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AsyncJobQueueService {

	_maxConcurrency = 5;
	
	constructor() {

	}

	getQueue(doWorkFunc /* must return a promise */) {

		if (!doWorkFunc) {
			throw new Error("A null or undefined function was passed to the async-job-queue.");
		}
		
		// given a function, this method, getQueue(), will allow you to queue up,
		//	 to run asynchronously, a number of calls to that function.

		let emitter = undefined;

		// The 'observable' part is the data that people give to a function; that is what runs through this queue.
		let asyncQueue = Rx.Observable.create(e => emitter = e);

		// when that data is presented to the queue, the queue can take one of three actions. We define them here.
		let observer = {
			next:
			(data) => {
				// execute a job
				try {
					let v = doWorkFunc(data);
					
					if (!v) {
						throw new Error("The value in the worker function given to async-job-queue, was not an async function or a promise.")
					}
				
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

		// With this line we tell our currently-being-created queue, here's what to do when something happens.
		let disposable = asyncQueue.subscribe(observer.next, observer.err, observer.complete);

		// above is the basis of a queue which will asynchronously run a function for as many times as you call
		//  it with data. What we need now is to throttle this a bit, so that only a few executions of our function
		//  can happen at any given time. This object we return does that throttling. A client will be able to call
		//  on our object to process data as many times as they would like, and this object will ensure they all run, 
		//  but only a few at at time, not all of them.

		let _total = 0;
		let maxConcurrency = this.getMaxConcurrency();
		let waiting2ProcessingQueue = [];
		let currentlyProcessingQueue = [];

		let rtn = {
			next: (data) => { 
				
				let inst = {};
				let instId = ++_total;

				if (!data) data = {};

				inst["id"] = instId;
				inst["data"] = data;

				data["instId"] = inst["id"];
				data["doneFunc"] = () => { 

					// TODO: Think about how to tell that the client is NOT calling this function when
					//  the queueFunction completes. If they do not call this function, they will experience
					//  errors where items do not get processed, because the throttled queue is full, and 
					//  they are not calling this function to empty it. That will be a common error, and
					//  if we can tell, and generate a helpful message, the world will be a better place.
					// ---


					// since this function should only be called when the queueFunction has completed, we
					//  assume it's done, and remove it from our currently-processing queue
					currentlyProcessingQueue = currentlyProcessingQueue.filter((inst) => { 
						return inst.id && inst.id != instId;
					})

					// if there is a next-item-in-the-list
					let nextInst = waiting2ProcessingQueue.pop();

					// ...process it
					if (nextInst) {

						// using a macro task which will run in the next cycle of the event loop, give another 
						// item to our observable, so our observer can begin processing it.
						setTimeout(() => {
							emitter.next(nextInst["data"]);
						}, 0)
					}
				}

				if (currentlyProcessingQueue.length < maxConcurrency) {
					currentlyProcessingQueue.push(inst);

					setTimeout(() => {
						emitter.next(inst["data"]);
					}, 0);

				} else {
					waiting2ProcessingQueue.push(inst);
				}
			}
		}

		return rtn;
	}

	getMaxConcurrency() {
		return this._maxConcurrency;
	}

	setMaxConcurrency(val) {
		this._maxConcurrency = val; 
	}
}