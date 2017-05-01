import {
  ejectComponent,
  injectComponent,
  injectDirective,
} from './injectDirective';
import { attachToModule } from './attachToModule';
import { proxifyAngular } from './proxifyAngular';


const injular = {
  attachToModule,
  ejectComponent,
  injectComponent,
  injectDirective,
  proxifyAngular,
};

export default injular;
