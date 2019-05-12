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
      func : (data) => {
        console.log("Returning a promise for the TEST doWorkFunc");
        return new Promise((resolve, reject) => {
          // then
          console.log("----  Inside the doWork func for this queue");
          expect(data["value"]).toEqual(TEST_VALUE); 
          expect(++callCount).toEqual(1); done(); 

          resolve();
        })
      }
    }
    spyOn(obj, 'func').and.callThrough();

    // when
    let queue = service.getQueue(obj.func);

    let data = { value: TEST_VALUE };
    queue.next(data);

  })
});
