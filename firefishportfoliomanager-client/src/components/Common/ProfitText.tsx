import React from 'react';
import { Typography } from 'antd';
import styled from 'styled-components';

export const ProfitText = styled(Typography.Text)<{ profit: number }>`
  color: ${props => props.profit >= 0 ? '#52c41a' : '#ff4d4f'} !important;
  font-weight: 600;
`; 