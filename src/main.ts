import { GameApp } from './app/GameApp';
import './styles.css';

const root = document.querySelector<HTMLDivElement>('#app');

if (!root) {
  throw new Error('Missing #app root element.');
}

const app = new GameApp(root);
app.start();
