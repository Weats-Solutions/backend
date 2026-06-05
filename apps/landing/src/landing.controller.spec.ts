import { Test, TestingModule } from '@nestjs/testing';
import { LandingController } from './landing.controller';
import { LandingService } from './landing.service';

describe('LandingController', () => {
  let landingController: LandingController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [LandingController],
      providers: [LandingService],
    }).compile();

    landingController = app.get<LandingController>(LandingController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(landingController.getHello()).toBe('Hello World!');
    });
  });
});
