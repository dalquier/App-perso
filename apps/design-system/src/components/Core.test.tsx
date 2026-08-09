import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, test, vi } from 'vitest';
import { Button, Card, Chip, Field, IconButton, ListRow } from './Core';

test('loading retains label and reports busy', () => {
  render(<Button loading>Enregistrer</Button>);
  expect(screen.getByRole('button', { name: /Enregistrer/ })).toHaveAttribute('aria-busy', 'true');
});

test('icon button has label', () => {
  render(<IconButton label="Favori">☆</IconButton>);
  expect(screen.getByRole('button', { name: 'Favori' })).toBeVisible();
});

test('error is associated', () => {
  render(<Field id="postal" label="Code postal" status="error" message="Saisissez 5 chiffres" />);
  expect(screen.getByLabelText('Code postal')).toHaveAccessibleDescription('⚠ Saisissez 5 chiffres');
});

test('chip exposes pressed state', () => {
  render(<Chip selected>Actif</Chip>);
  expect(screen.getByRole('button', { name: /Actif/ })).toHaveAttribute('aria-pressed', 'true');
});

test('interactive card activates with Enter and Space', async () => {
  const user = userEvent.setup();
  const onClick = vi.fn();
  render(<Card variant="interactive" onClick={onClick}>Ouvrir le projet</Card>);
  const card = screen.getByRole('button', { name: 'Ouvrir le projet' });

  card.focus();
  await user.keyboard('{Enter}');
  await user.keyboard(' ');

  expect(onClick).toHaveBeenCalledTimes(2);
});

test.each(['navigation', 'selection'] as const)('%s row activates from the keyboard', async (variant) => {
  const user = userEvent.setup();
  const onActivate = vi.fn();
  render(<ListRow variant={variant} title={variant} onActivate={onActivate} />);
  const row = screen.getByRole('button', { name: variant });

  row.focus();
  await user.keyboard('{Enter}');
  await user.keyboard(' ');

  expect(onActivate).toHaveBeenCalledTimes(2);
});

test('toggle row changes its switch state with the keyboard', async () => {
  const user = userEvent.setup();
  function ToggleHarness() {
    const [checked, setChecked] = useState(false);
    return (
      <ListRow
        variant="toggle"
        title="Notifications"
        checked={checked}
        onActivate={() => setChecked((value) => !value)}
      />
    );
  }

  render(<ToggleHarness />);
  const toggle = screen.getByRole('switch', { name: 'Notifications' });
  toggle.focus();
  await user.keyboard(' ');
  expect(toggle).toHaveAttribute('aria-checked', 'true');
  await user.keyboard('{Enter}');
  expect(toggle).toHaveAttribute('aria-checked', 'false');
});
