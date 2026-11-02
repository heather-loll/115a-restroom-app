import { render, screen } from '@testing-library/react-native';
import BottomNav from './BottomNav';

test('shows add restroom button', async () => {
  await render(<BottomNav />);
  screen.getByText('Add Restroom');
});

test('shows settings button', async () => {
  await render(<BottomNav />);
  screen.getByLabelText('Open settings');
});

test('shows filter button', async () => {
  await render(<BottomNav />);
  screen.getByLabelText('Open filter options');
});
