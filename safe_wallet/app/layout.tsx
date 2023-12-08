"use client"
import type { Metadata } from 'next'
import { useState } from 'react'
import { Inter } from 'next/font/google'
import './globals.css'
import { useLightPush } from '@waku/react'
import { useWaku } from '@waku/react'
import { createEncoder, createDecoder } from '@waku/sdk'
import protobuf from 'protobufjs'
import { LightNodeProvider } from '@waku/react'
import { BrowserRouter } from 'react-router-dom'

const inter = Inter({ subsets: ['latin'] })



export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
 

  const NODE_OPTIONS = { defaultBootstrap: true };
  return (
<BrowserRouter>
<LightNodeProvider options={NODE_OPTIONS}>
    <html lang="en">
      <body className={inter.className}>
        {children}
        </body>
    </html>
</LightNodeProvider>
</BrowserRouter>
  )

}
