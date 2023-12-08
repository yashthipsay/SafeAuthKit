"use client"
import Image from 'next/image'
import { useState, useEffect } from 'react'
import {
  AuthKitSignInData,
  SafeAuthInitOptions,
  SafeAuthPack,
  SafeAuthUserInfo
} from '@safe-global/auth-kit'
import {EthHashInfo} from '@safe-global/safe-react-components'
import Safe, {EthersAdapter} from '@safe-global/protocol-kit'
import {ethers, BrowserProvider, Eip1193Provider} from 'ethers';
import AppBar from './components/Appbar';
import { getSafeTxV4TypedData, getTypedData, getV3TypedData } from './typedData'

export default function Home() {
  const [safeAuthPack, setSafeAuthPack] = useState<SafeAuthPack>()
  const [isAuthenticated, setIsAuthenticated] = useState(!!safeAuthPack?.isAuthenticated)
  const [safeAuthSignInResponse, setSafeAuthSignInResponse] = useState<AuthKitSignInData | null>(
    null
  )
  const [userInfo, setUserInfo] = useState<SafeAuthUserInfo | null>(null)
  const [chainId, setChainId] = useState<string>()
  const [balance, setBalance] = useState<string>()
  const [consoleMessage, setConsoleMessage] = useState<string>('')
  const [consoleTitle, setConsoleTitle] = useState<string>('')
  const [provider, setProvider] = useState<BrowserProvider>()


  useEffect(() => {
    // @ts-expect-error - Missing globals
    const params = new URL(window.document.location).searchParams
    const chainId = params.get('chainId');

    (async () => {
      const options: SafeAuthInitOptions = {
        enableLogging: true,
        buildEnv: 'production',
        chainConfig: {
          chainId: chainId || '0x64',
          rpcTarget: 'https://gnosis.drpc.org'
        }
      }

      const authPack = new SafeAuthPack()

      await authPack.init(options)

      console.log('safeAuthPack:safeEmbed', authPack.safeAuthEmbed)

      setSafeAuthPack(authPack)

      authPack.subscribe('accountsChanged', async (accounts) => {
        console.log('safeAuthPack:accountsChanged', accounts, authPack.isAuthenticated)
        if (authPack.isAuthenticated) {
          const signInInfo = await authPack?.signIn()

          setSafeAuthSignInResponse(signInInfo)
          setIsAuthenticated(true)
        }
      })

      authPack.subscribe('chainChanged', (eventData) =>
        console.log('safeAuthPack:chainChanged', eventData)
      )
    })()
  }, [])

  useEffect(()=> {
      if(!safeAuthPack || !isAuthenticated) return;
      (async () => {
        const web3Provider = safeAuthPack.getProvider()
        const userInfo = await safeAuthPack.getUserInfo()
  
        setUserInfo(userInfo)
  
        if (web3Provider) {
          const provider = new BrowserProvider(safeAuthPack.getProvider() as Eip1193Provider)
          const signer = await provider.getSigner()
          const signerAddress = await signer.getAddress()
  
          setChainId((await provider?.getNetwork()).chainId.toString())
          setBalance(
            ethers.formatEther((await provider.getBalance(signerAddress)) as ethers.BigNumberish)
          )
          setProvider(provider)
        }
      })()
  }, [isAuthenticated])

  const login = async() => {
    const signInInfo = await safeAuthPack?.signIn()

    setSafeAuthSignInResponse(signInInfo)
    setIsAuthenticated(true)
  }

  const logout = async () => {
    await safeAuthPack?.signOut()

    setSafeAuthSignInResponse(null)
  }

  const getUserInfo = async () => {
    const userInfo = await safeAuthPack?.getUserInfo()

    uiConsole('User Info', userInfo)
  }

  const getAccounts = async () => {
    const accounts = await provider?.send('eth_accounts', [])

    uiConsole('Accounts', accounts)
  }

  const getChainId = async () => {
    const chainId = await provider?.send('eth_chainId', [])

    uiConsole('ChainId', chainId)
  }

  const signAndExecuteSafeTx = async (index: number) => {
    const safeAddress = safeAuthSignInResponse?.safes?.[index] || '0x'

    // Wrap Web3Auth provider with ethers
    const provider = new BrowserProvider(safeAuthPack?.getProvider() as Eip1193Provider)
    const signer = await provider.getSigner()
    const ethAdapter = new EthersAdapter({
      ethers,
      signerOrProvider: signer
    })
    const protocolKit = await Safe.create({
      safeAddress,
      ethAdapter
    })

    // Create transaction
    let tx = await protocolKit.createTransaction({
      transactions: [
        {
          to: ethers.getAddress(safeAuthSignInResponse?.eoa || '0x'),
          data: '0x',
          value: ethers.parseUnits('0.0001', 'ether').toString()
        }
      ]
    })

    // Sign transaction. Not necessary to execute the transaction if the threshold is one
    // but kept to test the sign transaction modal
    tx = await protocolKit.signTransaction(tx)

    // Execute transaction
    const txResult = await protocolKit.executeTransaction(tx)
    uiConsole('Safe Transaction Result', txResult)
  }

  const signMessage = async (data: any, method: string) => {
    let signedMessage

    const params = {
      data,
      from: safeAuthSignInResponse?.eoa
    }

    if (method === 'eth_signTypedData') {
      signedMessage = await provider?.send(method, [params.data, params.from])
    } else if (method === 'eth_signTypedData_v3' || method === 'eth_signTypedData_v4') {
      signedMessage = await provider?.send(method, [params.from, JSON.stringify(params.data)])
    } else {
      signedMessage = await (await provider?.getSigner())?.signMessage(data)
    }

    uiConsole('Signed Message', signedMessage)
  }

  const sendTransaction = async () => {
    const tx = await provider?.send('eth_sendTransaction', [
      {
        from: safeAuthSignInResponse?.eoa,
        to: safeAuthSignInResponse?.eoa,
        value: ethers.parseUnits('0.00001', 'ether').toString(),
        gasLimit: 21000
      }
    ])

    uiConsole('Transaction Response', tx)
  }

  const uiConsole = (title: string, message: unknown) => {
    setConsoleTitle(title)
    setConsoleMessage(typeof message === 'string' ? message : JSON.stringify(message, null, 2))
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm lg:flex">
        <p className="fixed left-0 top-0 flex w-full justify-center border-b border-gray-300 bg-gradient-to-b from-zinc-200 pb-6 pt-8 backdrop-blur-2xl dark:border-neutral-800 dark:bg-zinc-800/30 dark:from-inherit lg:static lg:w-auto  lg:rounded-xl lg:border lg:bg-gray-200 lg:p-4 lg:dark:bg-zinc-800/30">
          Get started by editing&nbsp;
          <code className="font-mono font-bold">app/page.tsx</code>
        </p>
        <div className="fixed bottom-0 left-0 flex h-48 w-full items-end justify-center bg-gradient-to-t from-white via-white dark:from-black dark:via-black lg:static lg:h-auto lg:w-auto lg:bg-none">
          <a
            className="pointer-events-none flex place-items-center gap-2 p-8 lg:pointer-events-auto lg:p-0"
            href="https://vercel.com?utm_source=create-next-app&utm_medium=appdir-template&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            By{' '}
            <Image
              src="/vercel.svg"
              alt="Vercel Logo"
              className="dark:invert"
              width={100}
              height={24}
              priority
            />
          </a>
        </div>
      </div>

      <div className="relative flex place-items-center before:absolute before:h-[300px] before:w-[480px] before:-translate-x-1/2 before:rounded-full before:bg-gradient-radial before:from-white before:to-transparent before:blur-2xl before:content-[''] after:absolute after:-z-20 after:h-[180px] after:w-[240px] after:translate-x-1/3 after:bg-gradient-conic after:from-sky-200 after:via-blue-200 after:blur-2xl after:content-[''] before:dark:bg-gradient-to-br before:dark:from-transparent before:dark:to-blue-700 before:dark:opacity-10 after:dark:from-sky-900 after:dark:via-[#0141ff] after:dark:opacity-40 before:lg:h-[360px] z-[-1]">
        <Image
          className="relative dark:drop-shadow-[0_0_0.3rem_#ffffff70] dark:invert"
          src="/next.svg"
          alt="Next.js Logo"
          width={180}
          height={37}
          priority
        />
      </div>

      <div className="mb-32 grid text-center lg:max-w-5xl lg:w-full lg:mb-0 lg:grid-cols-4 lg:text-left">
      <div onClick={login}>
          <h2 className={`mb-3 text-2xl font-semibold`}>
            Docs{' '}
            <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
              -&gt;
            </span>
          </h2>
          <p className={`m-0 max-w-[30ch] text-sm opacity-50`}>
            Find in-depth information about Next.js features and API.
          </p>
          </div>

        <button onClick={(e) => {logout()}}>
          <h2 className={`mb-3 text-2xl font-semibold`}>
            Learn{' '}
            <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
              -&gt;
            </span>
          </h2>
          <p className={`m-0 max-w-[30ch] text-sm opacity-50`}>
            Learn about Next.js in an interactive course with&nbsp;quizzes!
          </p>
          </button>

        <a
          href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template&utm_campaign=create-next-app"
          className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100 hover:dark:border-neutral-700 hover:dark:bg-neutral-800/30"
          target="_blank"
          rel="noopener noreferrer"
        >
          <h2 className={`mb-3 text-2xl font-semibold`}>
            Templates{' '}
            <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
              -&gt;
            </span>
          </h2>
          <p className={`m-0 max-w-[30ch] text-sm opacity-50`}>
            Explore starter templates for Next.js.
          </p>
        </a>

        <a
          href="https://vercel.com/new?utm_source=create-next-app&utm_medium=appdir-template&utm_campaign=create-next-app"
          className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100 hover:dark:border-neutral-700 hover:dark:bg-neutral-800/30"
          target="_blank"
          rel="noopener noreferrer"
        >
          <h2 className={`mb-3 text-2xl font-semibold`}>
            Deploy{' '}
            <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
              -&gt;
            </span>
          </h2>
          <p className={`m-0 max-w-[30ch] text-sm opacity-50`}>
            Instantly deploy your Next.js site to a shareable URL with Vercel.
          </p>
        </a>
      </div>
    </main>
  )
}
