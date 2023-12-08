import { useState, useEffect } from 'react'
import { AuthContext, OrderState } from '@monerium/sdk'

import { Alert, Box, Button, TextField, CircularProgress as Loader } from '@mui/material'

type ConnectedProps = {
    authContext: AuthContext
    orderState: OrderState | undefined
    safe: string
    onLogout: () => void
    onTransfer: (iban: string, amount: string) => void
  }

  