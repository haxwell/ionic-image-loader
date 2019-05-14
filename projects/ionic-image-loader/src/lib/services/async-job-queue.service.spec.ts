import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AsyncJobQueueServiceComponent } from './async-job-queue.service.component';
import { AsyncJobQueueService } from './async-job-queue.service';

describe('AsyncJobQueueService', () => {
  let fixture: ComponentFixture<AsyncJobQueueServiceComponent>;
  let component: AsyncJobQueueServiceComponent;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        AsyncJobQueueServiceComponent
      ],
      providers: [
        AsyncJobQueueService
      ]
    }); // .compileComponents();

    fixture = TestBed.createComponent(AsyncJobQueueServiceComponent);
    component = fixture.componentInstance;
  }));

  it('should be created', () => {
    expect(component instanceof AsyncJobQueueServiceComponent).toBe(true);

    let service = component.getService();
    expect(service instanceof AsyncJobQueueService).toBe(true);
  });

  it('should complete the happy path with one data object', (done) => {
    // given
    let service = component.getService();

    const TEST_VALUE = 17;

    let callCount = 0;
    let obj = {
      func : async (data) => {
          // then
          expect(data["value"]).toEqual(TEST_VALUE); 
          expect(++callCount).toEqual(1); 

          done(); 
        }
    }
    spyOn(obj, 'func').and.callThrough();

    // when
    let queue = service.getQueue(obj.func);

    let data = { value: TEST_VALUE };
    queue.next(data);
  })

  let getRandomNumberBetween = (min, max) => {
    return Math.floor(Math.random() * (+max - +min)) + +min;
  }

  it('should complete the happy path with multiple data objects', (done) => {
    // given
    let service = component.getService();

    // TODO: Make this array of random length with random values
    const TEST_VALUES = [4,8,15,16,23,42];

    let callCount = 0;
    let obj = {
      func : async (data) => {
        // then
        let random = getRandomNumberBetween(0, 10);

        setTimeout(()=> {
          // TODO: Test that the id of this instance (instId) has only been seen once.
          //  Use an array with all the possible ids 0?..TEST_VALUES.length
          //  set each value to false, to indicate it has not been seen.
          //  then here in the test
          //  expect that it is false, and set it to true
          expect(data["value"]).toEqual(TEST_VALUES[data["arrayIndex"]]); 
          expect(++callCount).toBeLessThanOrEqual(TEST_VALUES.length);
          
          data["doneFunc"]();

          if (callCount === TEST_VALUES.length) 
            done(); 

        }, random);
      }
    }
    spyOn(obj, 'func').and.callThrough();

    // when
    let queue = service.getQueue(obj.func);

    TEST_VALUES.forEach((val, i) => {
      queue.next({arrayIndex: i, value: TEST_VALUES[i]});
    })
  });

  it('respects the max concurrency limit', (done) => {
    // given
    let service = component.getService();

    // TODO: Make this random
    let maxConcurrency = 2;
    service.setMaxConcurrency(maxConcurrency);

    // TODO: ...this too
    const TEST_VALUES = [4,8,15,16,23,42];

    let callCount = 0;
    let instanceCount = TEST_VALUES.length;

    let obj = {
      func : async (data) => {
        callCount++;

        // then
        expect(callCount).toBeLessThanOrEqual(maxConcurrency);

        let min = 0; // units of time
        let max = 2; // units of time

        let random = getRandomNumberBetween(min, max);

        let rtn = await new Promise((resolve, reject) => {
          setTimeout(() => {
            --callCount;

            data["doneFunc"]();

            // this works because we know how many instances we're creating in this test
            if (!--instanceCount) {
              done();
            } 

            resolve();

          }, random); 
        })

        return rtn;
      }
    }

    // when
    let queue = service.getQueue(obj.func);

    TEST_VALUES.forEach((val, i) => {
      queue.next({arrayIndex: i, value: TEST_VALUES[i]});
    })
  })
});
