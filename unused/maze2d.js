var INNER_SECTORS_PER_QUADRANT = 4;
var WALL_THICKNESS = 6;
var TRACK_WIDTH = 18;
var ROOM_RAD = 2 * TRACK_WIDTH;



maze(document.getElementById('decorationLeft'));
maze(document.getElementById('decorationRight'));
maze(document.getElementById('mainMaze'));



function maze(canvas) {

    //  Prepare to begin a new maze.
    var gfx = canvas.getContext('2d');
    var screenSize = canvas.getAttribute('width');
    if (screenSize > canvas.getAttribute('height')) screenSize = canvas.getAttribute('height');
    var center = parseInt(screenSize / 2);
    var tracks = parseInt(parseInt((screenSize - 10 - 2 * ROOM_RAD) / TRACK_WIDTH) / 2);
    if (tracks < 1) return; //  Exit if the canvas is too small.

    //  Set up the starting grid data.
    //  (first param = inner circle to outer; second param = position in the circle)
    var sectorsPerTrack = new Array(tracks);
    var trackCount = parseInt(ROOM_RAD / TRACK_WIDTH);
    var newTrackCount = trackCount;
    var sectors = 4 * INNER_SECTORS_PER_QUADRANT;
    for (var i = 0; i < tracks; i++) {
        sectorsPerTrack[i] = sectors;
        newTrackCount++;
        if (newTrackCount >= trackCount * 2) {
            trackCount = newTrackCount;
            sectors *= 2;
        }
    }
    var cell = new Array(tracks);
    for (var i = 0; i <= tracks; i++) cell[i] = new Array(sectorsPerTrack[tracks - 1]);
    var L = new Array(tracks);
    for (var i = 0; i <= tracks; i++) L[i] = new Array(sectorsPerTrack[tracks - 1]);
    var U = new Array(tracks);
    for (var i = 0; i <= tracks; i++) U[i] = new Array(sectorsPerTrack[tracks - 1]);
    var R = new Array(tracks);
    for (var i = 0; i <= tracks; i++) R[i] = new Array(sectorsPerTrack[tracks - 1]);
    var D = new Array(tracks);
    for (var i = 0; i <= tracks; i++) D[i] = new Array(sectorsPerTrack[tracks - 1]);
    for (var i = 0; i < tracks; i++) {
        for (var j = 0; j < sectorsPerTrack[tracks - 1]; j++) {
            cell[i][j] = 0;
            L[i][j] = 0;
            U[i][j] = 0;
            R[i][j] = 0;
            D[i][j] = 0;
        }
    }

    //  Initialize the maze-generating conditions.
    var X = 0,
        Y = parseInt(tracks / 2);
    crumb(gfx, cell, L, U, R, D, center, Y, X, tracks, sectorsPerTrack, screenSize);

    //  Launch the maze-generation animation.
    mazeLoop(gfx, screenSize, tracks, sectorsPerTrack, X, Y, cell, L, U, R, D, center, 1, 0);
}



function crumb(g, cell, L, U, R, D, center, track, sector, tracks, sectorsPerTrack, screenSize) {
    cell[track][sector] = 1;
    drawCell(g, cell, L, U, R, D, center, track, sector, tracks, sectorsPerTrack, screenSize);
}

function noCrumb(g, cell, L, U, R, D, center, track, sector, tracks, sectorsPerTrack, screenSize) {
    cell[track][sector] = 2;
    drawCell(g, cell, L, U, R, D, center, track, sector, tracks, sectorsPerTrack, screenSize);
}



function drawCell(g, cell, L, U, R, D, center, track, sector, tracks, sectorsPerTrack, screenSize) {

    //  Determine the smallest rectangular area that includes the desired cell.
    var rectA = screenSize,
        rectB = screenSize,
        rectC = 0,
        rectD = 0,
        x, y;
    x = center + (ROOM_RAD + TRACK_WIDTH * track) * Math.cos(6.28318530718 * sector / sectorsPerTrack[track]);
    if (rectA > x) rectA = parseInt(x);
    if (rectC < x) rectC = parseInt(x + 1);
    x = center + (ROOM_RAD + TRACK_WIDTH * track) * Math.cos(6.28318530718 * (sector + 1) / sectorsPerTrack[track]);
    if (rectA > x) rectA = parseInt(x);
    if (rectC < x) rectC = parseInt(x + 1);
    x = center + (ROOM_RAD + TRACK_WIDTH * (track + 1)) * Math.cos(6.28318530718 * sector / sectorsPerTrack[track]);
    if (rectA > x) rectA = parseInt(x);
    if (rectC < x) rectC = parseInt(x + 1);
    x = center + (ROOM_RAD + TRACK_WIDTH * (track + 1)) * Math.cos(6.28318530718 * (sector + 1) / sectorsPerTrack[track]);
    if (rectA > x) rectA = parseInt(x);
    if (rectC < x) rectC = parseInt(x + 1);
    y = center + (ROOM_RAD + TRACK_WIDTH * track) * Math.sin(6.28318530718 * sector / sectorsPerTrack[track]);
    if (rectB > y) rectB = parseInt(y);
    if (rectD < y) rectD = parseInt(y + 1);
    y = center + (ROOM_RAD + TRACK_WIDTH * track) * Math.sin(6.28318530718 * (sector + 1) / sectorsPerTrack[track]);
    if (rectB > y) rectB = parseInt(y);
    if (rectD < y) rectD = parseInt(y + 1);
    y = center + (ROOM_RAD + TRACK_WIDTH * (track + 1)) * Math.sin(6.28318530718 * sector / sectorsPerTrack[track]);
    if (rectB > y) rectB = parseInt(y);
    if (rectD < y) rectD = parseInt(y + 1);
    y = center + (ROOM_RAD + TRACK_WIDTH * (track + 1)) * Math.sin(6.28318530718 * (sector + 1) / sectorsPerTrack[track]);
    if (rectB > y) rectB = parseInt(y);
    if (rectD < y) rectD = parseInt(y + 1);

    //  Draw the cell.
    drawMazePart(g, rectA, rectB, rectC, rectD, 1, tracks, sectorsPerTrack, cell, L, U, R, D, center);
}



function drawMazePart(g, rectL, rectT, rectR, rectB, subPixels, tracks, sectorsPerTrack, cell, L, U, R, D, center) {

    var tX, tY, tDIST, dist2, distA, distB, distC, slopeA, slopeB, slopeC, slope, sectorSin, sectorCos;
    var pixSum, track, grey, sectorSkip, sectorIndex, i, j, ii, jj;
    var radA, radB, radC, radD;
    var radA2, radB2, radC2, radD2;
    var cosA, cosB, cosC;
    var sinA, sinB, sinC;
    var crumbShade;
    var c;

    //  Set up sine/cosine tables to avoid having to constantly recalculate them during bulk image processing.
    sectorSin = new Array(sectorsPerTrack[tracks - 1] * 2 + 1);
    sectorCos = new Array(sectorsPerTrack[tracks - 1] * 2 + 1);
    for (i = 0; i <= sectorsPerTrack[tracks - 1] * 2; i++) {
        sectorCos[i] = Math.cos(6.28318530718 * i / sectorsPerTrack[tracks - 1] / 2);
        sectorSin[i] = Math.sin(6.28318530718 * i / sectorsPerTrack[tracks - 1] / 2);
    }
    sectorSkip = new Array(tracks);
    for (i = 0; i < tracks; i++) sectorSkip[i] = parseInt(sectorsPerTrack[tracks - 1] / sectorsPerTrack[i]);

    //  Main loops to generate the maze image.
    for (j = rectT; j < rectB; j++) {
        for (i = rectL; i < rectR; i++) {
            pixSum = 0;
            crumbShade = false;
            for (jj = 0; jj < subPixels; jj++) {
                tY = j + (jj + .5) / subPixels - center;
                for (ii = 0; ii < subPixels; ii++) {
                    tX = i + (ii + .5) / subPixels - center;
                    tDIST = Math.sqrt(tX * tX + tY * tY);
                    track = parseInt((tDIST - ROOM_RAD) / TRACK_WIDTH);

                    //  Exterior region.
                    if (track >= tracks) {
                        if (tDIST < ROOM_RAD + TRACK_WIDTH * tracks + parseInt(WALL_THICKNESS / 2) && (subPixels == 1 || tX >= 0 || tY <= 0 || tY / tX >=
                            sectorSin[parseInt((sectorsPerTrack[tracks - 1] * 2) / 4) + 2] /
                            sectorCos[parseInt((sectorsPerTrack[tracks - 1] * 2) / 4) + 2] || ((tX - sectorCos[parseInt((sectorsPerTrack[tracks - 1] * 2) / 4) + 2] * (ROOM_RAD + TRACK_WIDTH * tracks)) * (tX - sectorCos[parseInt((sectorsPerTrack[tracks - 1] * 2) / 4) + 2] * (ROOM_RAD + TRACK_WIDTH * tracks)) + (tY - sectorSin[parseInt((sectorsPerTrack[tracks - 1] * 2) / 4) + 2] * (ROOM_RAD + TRACK_WIDTH * tracks)) * (tY - sectorSin[parseInt((sectorsPerTrack[tracks - 1] * 2) / 4) + 2] * (ROOM_RAD + TRACK_WIDTH * tracks)) <
                                parseInt(parseInt(WALL_THICKNESS / 2) * WALL_THICKNESS / 2)) || (tX * tX + (tY - (ROOM_RAD + TRACK_WIDTH * tracks)) * (tY - (ROOM_RAD + TRACK_WIDTH * tracks)) <
                                parseInt(parseInt(WALL_THICKNESS / 2) * WALL_THICKNESS / 2)))) {
                            pixSum++;
                        }
                    }

                    //  Interior region.
                    else if (tDIST < ROOM_RAD) {
                        if (tDIST >= ROOM_RAD - parseInt(WALL_THICKNESS / 2) && (subPixels == 1 || tX <= 0 || tY >= 0 || tY / tX >=
                            sectorSin[(parseInt((sectorsPerTrack[0] * 2) / 4) + 2) * sectorSkip[0]] /
                            sectorCos[(parseInt((sectorsPerTrack[0] * 2) / 4) + 2) * sectorSkip[0]] || ((tX - sectorCos[(parseInt((sectorsPerTrack[0] * 2) * 3 / 4) + 2) * sectorSkip[0]] * ROOM_RAD) * (tX - sectorCos[(parseInt((sectorsPerTrack[0] * 2) * 3 / 4) + 2) * sectorSkip[0]] * ROOM_RAD) + (tY - sectorSin[(parseInt((sectorsPerTrack[0] * 2) * 3 / 4) + 2) * sectorSkip[0]] * ROOM_RAD) * (tY - sectorSin[(parseInt((sectorsPerTrack[0] * 2) * 3 / 4) + 2) * sectorSkip[0]] * ROOM_RAD) <
                                parseInt(parseInt(WALL_THICKNESS / 2) * WALL_THICKNESS / 2)) || (tX * tX + (tY + ROOM_RAD) * (tY + ROOM_RAD) <
                                parseInt(parseInt(WALL_THICKNESS / 2) * WALL_THICKNESS / 2))) || (subPixels > 1 && tX * tX + tY * tY < (parseInt(parseInt(WALL_THICKNESS / 2) * WALL_THICKNESS / 2)))) {
                            pixSum++;
                        }
                    }

                    //  Cells of the maze.
                    else {
                        radA = ROOM_RAD + track * TRACK_WIDTH;
                        radA2 = radA * radA;
                        radB = ROOM_RAD + track * TRACK_WIDTH + parseInt(WALL_THICKNESS / 2);
                        radB2 = radB * radB;
                        radC = ROOM_RAD + (track + 1) * TRACK_WIDTH - parseInt(WALL_THICKNESS / 2);
                        radC2 = radC * radC;
                        radD = ROOM_RAD + (track + 1) * TRACK_WIDTH;
                        radD2 = radD * radD;
                        for (var sector = 0; sector < sectorsPerTrack[track]; sector++) {
                            sectorIndex = sector * 2 * sectorSkip[track];
                            cosA = sectorCos[sectorIndex];
                            sinA = sectorSin[sectorIndex];
                            sectorIndex += sectorSkip[track];
                            cosB = sectorCos[sectorIndex];
                            sinB = sectorSin[sectorIndex];
                            sectorIndex += sectorSkip[track];
                            cosC = sectorCos[sectorIndex];
                            sinC = sectorSin[sectorIndex];
                            if (cosA > -.00001 && cosA < .0001) {
                                cosA = -.0000001;
                                if (sinA < 0.) cosA *= -1.;
                            }
                            if (cosC > -.00001 && cosC < .0001) {
                                cosC = .0000001;
                                if (sinC < 0.) cosC *= -1.;
                            }
                            slopeA = sinA / cosA;
                            slopeB = sinB / cosB;
                            slopeC = sinC / cosC;
                            dist2 = tX * tX + tY * tY;
                            slope = tY / tX;
                            if (slope >= slopeA && tX * cosB > 0 && slope < slopeC && tY * sinB > 0 && dist2 >= radA2 && dist2 < radD2) { //  Pixel is governed by this cell.
                                distA = Math.abs(tY * cosA - tX * sinA);
                                if (cell[track][sector] == 1) crumbShade = true;
                                distB = Math.abs(tY * cosB - tX * sinB);
                                distC = Math.abs(tY * cosC - tX * sinC);
                                //  Corner posts.
                                if ((dist2 < radB2 || dist2 >= radC2) && (distA < WALL_THICKNESS / 2 || distB < WALL_THICKNESS / 2 && track < tracks - 1 && sectorsPerTrack[track] < sectorsPerTrack[track + 1] && dist2 >= radC2 || distC < WALL_THICKNESS / 2)
                                    //  (The rest of this "if" condition rounds off the exterior corners of the walls.)
                                    && (subPixels == 1 || (tX - sectorCos[sector * 2 * sectorSkip[track]] * (ROOM_RAD + TRACK_WIDTH * track + TRACK_WIDTH)) * (tX - sectorCos[sector * 2 * sectorSkip[track]] * (ROOM_RAD + TRACK_WIDTH * track + TRACK_WIDTH)) + (tY - sectorSin[sector * 2 * sectorSkip[track]] * (ROOM_RAD + TRACK_WIDTH * track + TRACK_WIDTH)) * (tY - sectorSin[sector * 2 * sectorSkip[track]] * (ROOM_RAD + TRACK_WIDTH * track + TRACK_WIDTH)) <
                                        WALL_THICKNESS / 2 * WALL_THICKNESS / 2 || (tX - sectorCos[(sector * 2 + 1) * sectorSkip[track]] * (ROOM_RAD + TRACK_WIDTH * track + TRACK_WIDTH)) * (tX - sectorCos[(sector * 2 + 1) * sectorSkip[track]] * (ROOM_RAD + TRACK_WIDTH * track + TRACK_WIDTH)) + (tY - sectorSin[(sector * 2 + 1) * sectorSkip[track]] * (ROOM_RAD + TRACK_WIDTH * track + TRACK_WIDTH)) * (tY - sectorSin[(sector * 2 + 1) * sectorSkip[track]] * (ROOM_RAD + TRACK_WIDTH * track + TRACK_WIDTH)) <
                                        WALL_THICKNESS / 2 * WALL_THICKNESS / 2 || (tX - sectorCos[(sector * 2 + 2) * sectorSkip[track]] * (ROOM_RAD + TRACK_WIDTH * track + TRACK_WIDTH)) * (tX - sectorCos[(sector * 2 + 2) * sectorSkip[track]] * (ROOM_RAD + TRACK_WIDTH * track + TRACK_WIDTH)) + (tY - sectorSin[(sector * 2 + 2) * sectorSkip[track]] * (ROOM_RAD + TRACK_WIDTH * track + TRACK_WIDTH)) * (tY - sectorSin[(sector * 2 + 2) * sectorSkip[track]] * (ROOM_RAD + TRACK_WIDTH * track + TRACK_WIDTH)) <
                                        WALL_THICKNESS / 2 * WALL_THICKNESS / 2 || (tX - sectorCos[sector * 2 * sectorSkip[track]] * (ROOM_RAD + TRACK_WIDTH * track)) * (tX - sectorCos[sector * 2 * sectorSkip[track]] * (ROOM_RAD + TRACK_WIDTH * track)) + (tY - sectorSin[sector * 2 * sectorSkip[track]] * (ROOM_RAD + TRACK_WIDTH * track)) * (tY - sectorSin[sector * 2 * sectorSkip[track]] * (ROOM_RAD + TRACK_WIDTH * track)) <
                                        WALL_THICKNESS / 2 * WALL_THICKNESS / 2 || (tX - sectorCos[(sector * 2 + 2) * sectorSkip[track]] * (ROOM_RAD + TRACK_WIDTH * track)) * (tX - sectorCos[(sector * 2 + 2) * sectorSkip[track]] * (ROOM_RAD + TRACK_WIDTH * track)) + (tY - sectorSin[(sector * 2 + 2) * sectorSkip[track]] * (ROOM_RAD + TRACK_WIDTH * track)) * (tY - sectorSin[(sector * 2 + 2) * sectorSkip[track]] * (ROOM_RAD + TRACK_WIDTH * track)) <
                                        WALL_THICKNESS / 2 * WALL_THICKNESS / 2)) {
                                    pixSum++;
                                    break;
                                }
                                //  Concentric walls of the cell.
                                else if (dist2 < radB2 && U[track][sector] == 0 || dist2 >= radC2 && D[track][sector] == 0 || track < tracks - 1 && sectorsPerTrack[track] < sectorsPerTrack[track + 1] && dist2 >= radC2 && (U[track + 1][sector * 2] == 0 && slope < slopeB || U[track + 1][sector * 2 + 1] == 0 && slope >= slopeB)) {
                                    pixSum++;
                                    break;
                                }
                                //  Radial walls of the cell.
                                else if (distA < WALL_THICKNESS / 2 && L[track][sector] == 0) {
                                    pixSum++;
                                    break;
                                } else if (distC < WALL_THICKNESS / 2 && R[track][sector] == 0) {
                                    pixSum++;
                                    break;
                                }
                            }
                        }
                    }
                }
            }
            grey = 255 - parseInt(255 * pixSum / (subPixels * subPixels));
            if (subPixels == 1) grey = parseInt(grey * 4 / 5);
            if (!crumbShade) g.fillStyle = 'rgb(' + grey + ',' + grey + ',' + grey + ')';
            else g.fillStyle = 'rgb(' + grey + ',' + grey + ',' + parseInt(grey / 4) + ')';
            g.fillRect(i, j, 1, 1);
        }
    }
    g.fillStyle = 'rgb(0,0,0)';
}



function mazeLoop(g, screenSize, tracks, sectorsPerTrack, X, Y, cell, L, U, R, D, center, subPixels, fullDrawY) {

    var done = false;

    //  If the full maze is being drawn, just draw a strip of it and relaunch this function.
    if (fullDrawY < screenSize) {
        var newY = fullDrawY + 4;
        if (newY > screenSize) newY = screenSize;
        drawMazePart(g, 0, fullDrawY, screenSize, newY, subPixels, tracks, sectorsPerTrack, cell, L, U, R, D, center);
        setTimeout(function () {
            mazeLoop(g, screenSize, tracks, sectorsPerTrack, X, Y, cell, L, U, R, D, center, subPixels, newY);
        }, 5);
        return;
    }

    //  Detect maze completion and end execution.
    if (subPixels > 1) return;

    //  Make a list of up to 5 ways that the trail can be extended.
    var options = 0,
        direc = new Array(5),
        dist = new Array(5);
    if (X > 0 && cell[Y][X - 1] == 0 || X == 0 && cell[Y][X - 1 + sectorsPerTrack[Y]] == 0) {
        direc[options] = 'L';
        dist[options] = 1;
        options++;
    }
    if (Y > 0) {
        if (sectorsPerTrack[Y] == sectorsPerTrack[Y - 1]) {
            if (cell[Y - 1][X] == 0) {
                direc[options] = 'U';
                dist[options] = 1;
                options++;
            }
        } else {
            if (cell[Y - 1][parseInt(X / 2)] == 0) {
                direc[options] = 'U';
                dist[options] = 1;
                options++;
            }
        }
    }
    if (X < sectorsPerTrack[Y] - 1 && cell[Y][X + 1] == 0 || X == sectorsPerTrack[Y] - 1 && cell[Y][X + 1 - sectorsPerTrack[Y]] == 0) {
        direc[options] = 'R';
        dist[options] = 1;
        options++;
    }
    if (Y < tracks - 1) {
        if (sectorsPerTrack[Y] == sectorsPerTrack[Y + 1]) {
            if (cell[Y + 1][X] == 0) {
                direc[options] = 'D';
                dist[options] = 1;
                options++;
            }
        } else {
            if (cell[Y + 1][X * 2] == 0) {
                direc[options] = 'D';
                dist[options] = 1;
                options++;
            }
            if (cell[Y + 1][X * 2 + 1] == 0) {
                direc[options] = 'E';
                dist[options] = 1;
                options++;
            }
        }
    }

    if (options > 0) { //  Extend the path.
        var i = Math.floor(Math.random() * options),
            oldX, oldY;
        if (direc[i] == 'L') {
            L[Y][X] = dist[i];
            oldX = X;
            oldY = Y;
            X -= dist[i];
            if (X < 0) X += sectorsPerTrack[Y];
            R[Y][X] = dist[i];
            drawCell(g, cell, L, U, R, D, center, oldY, oldX, tracks, sectorsPerTrack, screenSize);
            crumb(g, cell, L, U, R, D, center, Y, X, tracks, sectorsPerTrack, screenSize);
        }
        if (direc[i] == 'U') {
            U[Y][X] = dist[i];
            oldX = X;
            oldY = Y;
            Y -= dist[i];
            if (sectorsPerTrack[Y] < sectorsPerTrack[Y + 1]) X = parseInt(X / 2);
            D[Y][X] = dist[i];
            drawCell(g, cell, L, U, R, D, center, oldY, oldX, tracks, sectorsPerTrack, screenSize);
            crumb(g, cell, L, U, R, D, center, Y, X, tracks, sectorsPerTrack, screenSize);
        }
        if (direc[i] == 'R') {
            R[Y][X] = dist[i];
            oldX = X;
            oldY = Y;
            X += dist[i];
            if (X >= sectorsPerTrack[Y]) X -= sectorsPerTrack[Y];
            L[Y][X] = dist[i];
            drawCell(g, cell, L, U, R, D, center, oldY, oldX, tracks, sectorsPerTrack, screenSize);
            crumb(g, cell, L, U, R, D, center, Y, X, tracks, sectorsPerTrack, screenSize);
        }
        if (direc[i] == 'D' || direc[i] == 'E') {
            D[Y][X] = dist[i];
            oldX = X;
            oldY = Y;
            Y += dist[i];
            if (sectorsPerTrack[Y] > sectorsPerTrack[Y - 1]) {
                X *= 2;
                if (direc[i] == 'E') X++;
            }
            U[Y][X] = dist[i];
            drawCell(g, cell, L, U, R, D, center, oldY, oldX, tracks, sectorsPerTrack, screenSize);
            crumb(g, cell, L, U, R, D, center, Y, X, tracks, sectorsPerTrack, screenSize);
        }
    } else { //  Retreat the trail.
        done = true;
        noCrumb(g, cell, L, U, R, D, center, Y, X, tracks, sectorsPerTrack, screenSize);
        if (L[Y][X] > 0) {
            if (X > 0 && cell[Y][X - L[Y][X]] == 1 || X == 0 && cell[Y][X - L[Y][X] + sectorsPerTrack[Y]] == 1) {
                done = false;
                X -= L[Y][X];
                if (X < 0) X += sectorsPerTrack[Y];
            }
        }
        if (done && U[Y][X] > 0) {
            if (sectorsPerTrack[Y] == sectorsPerTrack[Y - 1]) {
                if (cell[Y - U[Y][X]][X] == 1) {
                    done = false;
                    Y -= U[Y][X];
                }
            } else {
                if (cell[Y - U[Y][X]][parseInt(X / 2)] == 1) {
                    done = false;
                    Y -= U[Y][X];
                    X = parseInt(X / 2);
                }
            }
        }
        if (done && R[Y][X] > 0) {
            if (X < sectorsPerTrack[Y] - 1 && cell[Y][X + R[Y][X]] == 1 || X == sectorsPerTrack[Y] - 1 && cell[Y][X + R[Y][X] - sectorsPerTrack[Y]] == 1) {
                done = false;
                X += R[Y][X];
                if (X >= sectorsPerTrack[Y]) X -= sectorsPerTrack[Y];
            }
        }
        if (done && D[Y][X] > 0) {
            if (sectorsPerTrack[Y] == sectorsPerTrack[Y + 1]) {
                if (cell[Y + 1][X] == 1) {
                    done = false;
                    Y += D[Y][X];
                }
            } else {
                if (cell[Y + 1][X * 2] == 1 && U[Y + 1][X * 2] > 0) {
                    done = false;
                    Y++;
                    X *= 2;
                } else if (cell[Y + 1][X * 2 + 1] == 1 && U[Y + 1][X * 2 + 1] > 0) {
                    done = false;
                    Y++;
                    X *= 2;
                    X++;
                }
            }
        }
        if (done) {
            //  Maze is done -- open up the start and end.
            D[tracks - 1][parseInt(sectorsPerTrack[tracks - 1] / 4)] = 1;
            U[0][parseInt(sectorsPerTrack[0] * 3 / 4)] = 1;
            //  Redraw the entire maze to open up the start and end, and to perform other pretty touch-ups.
            subPixels = 4;
            fullDrawY = 0;
        }
    }

    //  Continue the loop.
    setTimeout(function () {
        mazeLoop(g, screenSize, tracks, sectorsPerTrack, X, Y, cell, L, U, R, D, center, subPixels, fullDrawY);
    }, 20);
}