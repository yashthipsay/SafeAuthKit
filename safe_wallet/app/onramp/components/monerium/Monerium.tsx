import { useState, useEffect } from 'react'
import { ethers } from 'ethers'
import { AuthContext, Currency, OrderState, PaymentStandard } from '@monerium/sdk'
import { Box } from '@mui/material'
import Safe, { EthersAdapter } from '@safe-global/protocol-kit'

import { useAuth } from '../../AuthContext'
import { MoneriumPack, SafeMoneriumClient } from '@safe-global/onramp-kit'
import Disconnected from './Disconnected'
import DeploySafe from './DeploySafe'
import LoginWithMonerium from './LoginWithMonerium'
import Connected from './Connected'

const MONERIUM_TOKEN = 'monerium_token'