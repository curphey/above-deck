import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ChannelInfo } from '../ChannelInfo';

describe('ChannelInfo', () => {
  it('renders "On Channel" header', () => {
    render(<ChannelInfo region="uk-south" />);
    expect(screen.getByText('On Channel')).toBeInTheDocument();
  });

  it('renders coastguard agents for uk-south', () => {
    render(<ChannelInfo region="uk-south" />);
    expect(screen.getByText('Solent Coastguard')).toBeInTheDocument();
    expect(screen.getByText('Falmouth Coastguard')).toBeInTheDocument();
  });

  it('renders vessel agents for uk-south', () => {
    render(<ChannelInfo region="uk-south" />);
    expect(screen.getByText('Doris May')).toBeInTheDocument();
    expect(screen.getByText('Blue Horizon')).toBeInTheDocument();
    expect(screen.getByText('Saoirse')).toBeInTheDocument();
  });

  it('renders caribbean agents', () => {
    render(<ChannelInfo region="caribbean" />);
    expect(screen.getByText('VISAR')).toBeInTheDocument();
    expect(screen.getByText('Antigua Coastguard')).toBeInTheDocument();
    expect(screen.getByText('Island Time')).toBeInTheDocument();
  });

  it('renders med-greece agents', () => {
    render(<ChannelInfo region="med-greece" />);
    expect(screen.getByText('Olympia Radio')).toBeInTheDocument();
    expect(screen.getByText('Piraeus JRCC')).toBeInTheDocument();
  });

  it('renders se-asia agents', () => {
    render(<ChannelInfo region="se-asia" />);
    expect(screen.getByText('MRCC Phuket')).toBeInTheDocument();
    expect(screen.getByText('MRCC Putrajaya')).toBeInTheDocument();
  });

  it('renders pacific agents', () => {
    render(<ChannelInfo region="pacific" />);
    expect(screen.getByText('MRCC Suva')).toBeInTheDocument();
    expect(screen.getByText("Nuku'alofa Radio")).toBeInTheDocument();
  });

  it('renders atlantic agents', () => {
    render(<ChannelInfo region="atlantic" />);
    expect(screen.getByText('Las Palmas Radio')).toBeInTheDocument();
    expect(screen.getByText('Cape Verde Radio')).toBeInTheDocument();
  });

  it('renders nothing for unknown region', () => {
    const { container } = render(<ChannelInfo region="unknown-region" />);
    expect(container.firstChild).toBeNull();
  });

  it('applies distinct styles to coastguard vs vessel chips', () => {
    render(<ChannelInfo region="uk-south" />);
    const cgChip = screen.getByText('Solent Coastguard');
    const vesselChip = screen.getByText('Doris May');
    expect(cgChip.style.color).toBe('rgb(96, 165, 250)');
    expect(vesselChip.style.color).toBe('rgb(139, 139, 158)');
  });
});
