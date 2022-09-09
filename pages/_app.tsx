import { ChakraProvider } from '@chakra-ui/react';
import { extendTheme } from '@chakra-ui/react';
import type { AppProps } from 'next/app';
import React from 'react';

const colors = {
  home: {
    100: '#B71FFF',
    200: '#B371D2',
    300: '#410060',
  },
  app: {
    100: '#1a365d',
  },
  metamask: {
    500: '#FF981F',
  },
  errors: {
    100: '#FF5A5A',
    200: '#FFC42D',
  },
};

const theme = extendTheme({ colors });

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <ChakraProvider theme={theme}>
      <Component {...pageProps} />
    </ChakraProvider>
  );
}

export default MyApp;
