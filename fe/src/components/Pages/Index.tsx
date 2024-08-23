import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

const PUBLIC_START_DATE = '2025-01-01T00:00:00Z';

interface Rule {
    rule: string;
    points: string;
}

const rules: Rule[] = [
    { rule: 'Ottelun lopputulos täysin oikein', points: '+6' },
    {
        rule: 'Veikkaat tasapeliä ja ottelu päättyy tasan. Yksi lisäpiste, vaikka tulos ei ole oikea',
        points: '+4',
    },
    { rule: 'Ottelun voittaja oikein', points: '+3' },
    { rule: 'Joukkueen maalimäärä oikein', points: '+1' },
    {
        rule: 'Veikkaat tasapeliä, mutta ottelu ei pääty tasapeliin',
        points: '-2',
    },
    {
        rule: 'Veikkaat jommankumman voittoa, mutta ottelu päättyy tasapeliin',
        points: '-2',
    },
    { rule: 'Väärä voittaja', points: '-4' },
];

export function Index() {
    const { t } = useTranslation();

    const [timeLeft, setTimeLeft] = useState<number>(
        new Date(PUBLIC_START_DATE).getTime() - new Date().getTime(),
    );
    const countDownDate = new Date(PUBLIC_START_DATE).getTime();

    const calculateTimeLeft = () => {
        const now = new Date().getTime();
        return countDownDate - now;
    };

    useEffect(() => {
        const interval = setInterval(() => {
            const timeLeft = calculateTimeLeft();
            if (timeLeft < 0) {
                clearInterval(interval);
                setTimeLeft(0);
            } else {
                setTimeLeft(timeLeft);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
    const hours = Math.floor(
        (timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
    );
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

    const columns = [
        {
            key: 'rule',
            title: `${t('index.rule')}`,
            value: (r: Rule) => r.rule,
            sortable: false,
        },
        {
            key: 'points',
            title: `${t('index.points')}`,
            value: (r: Rule) => r.points,
            sortable: true,
        },
    ];

    return (
        <div className="m-4 p-4 items-center text-center pt-8">
            {new Date(PUBLIC_START_DATE) > new Date() && (
                <div className="mb-8 p-4">
                    <div className="text-4xl font-bold">KISOJEN ALKUUN</div>
                    <div className="justify-center grid grid-flow-col gap-5 text-center auto-cols-max pt-4">
                        <div className="flex flex-col">
                            <span className="countdown font-mono text-5xl">
                                {days}
                            </span>
                            {t('index.days')}
                        </div>
                        <div className="flex flex-col">
                            <span className="countdown font-mono text-5xl">
                                {hours}
                            </span>
                            {t('index.days')}
                        </div>
                        <div className="flex flex-col">
                            <span className="countdown font-mono text-5xl">
                                {minutes}
                            </span>
                            {t('index.minutes')}
                        </div>
                        <div className="flex flex-col">
                            <span className="countdown font-mono text-5xl">
                                {seconds}
                            </span>
                            {t('index.seconds')}
                        </div>
                    </div>
                </div>
            )}

            <div className="card glass max-w-xl m-4 p-4 border-inherit shadow-lg rounded-xl">
                <div className="text-4xl font-bold">Säännöt</div>
                <table className="table-auto w-full">
                    <thead>
                        <tr>
                            {columns.map((c) => (
                                <th
                                    key={c.key}
                                    className="px-4 py-2 text-left"
                                    onClick={() => console.log('sort', c.key)}
                                >
                                    {c.title}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {rules.map((rule) => (
                            <tr key={rule.rule}>
                                {columns.map((c) => (
                                    <td
                                        key={c.key}
                                        className="border px-4 py-2"
                                    >
                                        {c.value(rule)}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
