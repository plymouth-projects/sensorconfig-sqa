import { SVGAttributes } from 'react';
import { Logo } from './logo';

export default function AppLogoIcon(props: SVGAttributes<SVGElement>) {
    return (
        <div  className=' dark:text-black text-white'>
            <Logo/>
        </div>
    );
}
