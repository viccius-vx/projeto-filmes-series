$episodesData = @{
    1 = @(15576, 15578, 15580, 15582, 15584, 15586, 15588, 15590, 15592, 15594, 15596, 15598, 15600)
    2 = @(282493, 282494, 282495, 282496, 282497, 282498, 282499, 282500, 282501)
    3 = @(282502, 57651, 57650, 57649, 57648, 57644, 57646, 57643)
    4 = @(282504, 282505, 282506, 282507, 282508, 282509, 282510, 282511)
    5 = @(158395, 158394, 158393, 158392, 170220, 170210, 170212, 170214, 170216, 170218)
}

for ($season = 1; $season -le 5; $season++) {
    $epArray = $episodesData[$season]
    for ($i = 0; $i -lt $epArray.Length; $i++) {
        $epId = $epArray[$i]
        $ep = $i + 1
        
        $folderName = "temp$($season)ep$($ep)"
        $folderPath = Join-Path -Path $PWD -ChildPath $folderName
        
        if (-not (Test-Path -Path $folderPath)) {
            New-Item -ItemType Directory -Path $folderPath | Out-Null
        }

        $htmlContent = @"
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>La Casa de Papel - T$($season)E$($ep) (Dublado)</title>
    <style>
        body, html { 
            margin: 0; 
            padding: 0; 
            width: 100%; 
            height: 100%; 
            background: #0b0b0f; 
            background-image: radial-gradient(circle at 50% 0%, #2b0b10 0%, #0b0b0f 70%);
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: sans-serif;
        }
        
        .player-wrapper {
            width: 80%;
            max-width: 900px;
            aspect-ratio: 16/9;
            background: #000;
            border-radius: 12px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.6);
            overflow: hidden;
            position: relative;
            border: 2px solid rgba(255,255,255,0.1);
        }

        @media (max-width: 768px) {
            .player-wrapper {
                width: 95%;
            }
        }

        iframe { 
            width: 100%; 
            height: 100%; 
            border: none; 
        }

        .back-btn {
            position: absolute;
            top: 20px;
            left: 20px;
            background: rgba(255, 255, 255, 0.1);
            color: white;
            padding: 10px 20px;
            text-decoration: none;
            border-radius: 8px;
            font-size: 14px;
            z-index: 10;
            transition: 0.3s;
            border: 1px solid rgba(255,255,255,0.2);
            backdrop-filter: blur(10px);
        }
        .back-btn:hover { 
            background: #e50914; 
            border-color: #e50914;
        }
    </style>
</head>
<body>
    <a href="../index.html" class="back-btn">&larr; Voltar</a>
    
    <div class="player-wrapper">
        <iframe src="https://painel-aso.top/episodio/$epId" allowfullscreen="true" webkitallowfullscreen="true" mozallowfullscreen="true"></iframe>
    </div>
</body>
</html>
"@

        $filePath = Join-Path -Path $folderPath -ChildPath "index.html"
        Set-Content -Path $filePath -Value $htmlContent -Encoding UTF8
    }
}
Write-Output "Páginas recriadas com servidor DUBLADO!"
